#!/usr/bin/env python3
"""Agent-independent literature and researcher memory; Python standard library only."""
import argparse
from datetime import date, datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import tempfile
import unicodedata


def now():
    return datetime.now(timezone.utc).isoformat()


def normalized(text):
    return " ".join(re.findall(r"\w+", unicodedata.normalize("NFKC", text).casefold()))


def home_path():
    return Path(os.environ.get("JUNSHI_HOME", "~/.junshi")).expanduser().resolve()


def atomic_write(path, content):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def identifiers(paper):
    aliases = set()
    doi = re.sub(r"^(?:https?://(?:dx\.)?doi.org/|doi:\s*)", "",
                 paper.get("doi", "").strip(), flags=re.I).lower()
    if doi:
        if not re.fullmatch(r"10\.\d{4,9}/\S+", doi):
            raise ValueError("Invalid DOI")
        aliases.add("doi:" + doi)
        if doi.startswith("10.48550/arxiv."):
            aliases.add("arxiv:" + re.sub(r"v\d+$", "", doi[len("10.48550/arxiv."):]))
    arxiv = re.sub(r"^https?://(?:export\.)?arxiv.org/(?:abs|pdf)/|^arxiv:\s*", "",
                   paper.get("arxiv_id", "").strip(), flags=re.I)
    arxiv = re.sub(r"(?:\.pdf)?$", "", arxiv)
    arxiv = re.sub(r"v\d+$", "", arxiv)
    if arxiv:
        if not re.fullmatch(r"(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})", arxiv):
            raise ValueError("Invalid arXiv ID")
        aliases.add("arxiv:" + arxiv)
    return aliases


class Memory:
    def __init__(self, root=None):
        self.root = Path(root) if root is not None else home_path()
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.db = sqlite3.connect(self.root / "memory.sqlite3", timeout=30)
        os.chmod(self.root / "memory.sqlite3", 0o600)
        self.db.row_factory = sqlite3.Row
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT, title_key TEXT NOT NULL, data TEXT NOT NULL,
                first_seen TEXT NOT NULL, last_seen TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS titles ON papers(title_key);
            CREATE TABLE IF NOT EXISTS aliases (alias TEXT PRIMARY KEY, paper_id INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS merged_ids (old_id INTEGER PRIMARY KEY, paper_id INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS history (
                paper_id INTEGER NOT NULL, fingerprint TEXT NOT NULL, observed TEXT NOT NULL,
                data TEXT NOT NULL, PRIMARY KEY(paper_id, fingerprint));
            CREATE TABLE IF NOT EXISTS recommendations (
                paper_id INTEGER NOT NULL, day TEXT NOT NULL, PRIMARY KEY(paper_id, day));
            CREATE TABLE IF NOT EXISTS memories (
                key TEXT PRIMARY KEY, kind TEXT NOT NULL, text TEXT NOT NULL,
                status TEXT NOT NULL, reason TEXT NOT NULL, updated TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS memory_history (
                key TEXT NOT NULL, observed TEXT NOT NULL, data TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS digests (day TEXT PRIMARY KEY, content TEXT NOT NULL);
        """)

    def close(self):
        self.db.close()

    def _ingest(self, paper):
        if not isinstance(paper, dict) or not isinstance(paper.get("title"), str) or not paper["title"].strip():
            raise ValueError("Each paper needs a nonempty title")
        if not isinstance(paper.get("authors", []), list) or any(not isinstance(a, str) for a in paper.get("authors", [])):
            raise ValueError("authors must be a list of names")
        for field in ("abstract", "doi", "arxiv_id", "url", "venue", "published", "updated", "source"):
            if field in paper and not isinstance(paper[field], str):
                raise ValueError(field + " must be text")
        aliases = identifiers(paper)
        if not aliases and not any(normalized(a) for a in paper.get("authors", [])):
            raise ValueError("A paper needs a DOI, arXiv ID, or authors for identity")
        key, stamp = normalized(paper["title"]), now()
        matches = {r[0] for a in aliases for r in self.db.execute(
            "SELECT paper_id FROM aliases WHERE alias=?", (a,))}
        authors = {normalized(a) for a in paper.get("authors", []) if normalized(a)}
        title_matches = {r["id"] for r in self.db.execute("SELECT * FROM papers WHERE title_key=?", (key,))
                         if authors & {normalized(a) for a in json.loads(r["data"]).get("authors", [])}}
        # Title + author is a conservative fallback; ambiguous titles remain separate.
        if len(title_matches) == 1:
            matches.update(title_matches)
        if matches:
            pid = min(matches)
            data = json.loads(self.db.execute("SELECT data FROM papers WHERE id=?", (pid,)).fetchone()[0])
            # A later record can bridge previously disconnected preprint/venue identities.
            for old in sorted(matches - {pid}):
                other = json.loads(self.db.execute("SELECT data FROM papers WHERE id=?", (old,)).fetchone()[0])
                data.update({k: v for k, v in other.items() if v and not data.get(k)})
                self.db.execute("UPDATE aliases SET paper_id=? WHERE paper_id=?", (pid, old))
                self.db.execute("INSERT OR IGNORE INTO history SELECT ?,fingerprint,observed,data FROM history WHERE paper_id=?", (pid, old))
                self.db.execute("INSERT OR IGNORE INTO recommendations SELECT ?,day FROM recommendations WHERE paper_id=?", (pid, old))
                self.db.execute("UPDATE papers SET first_seen=min(first_seen,(SELECT first_seen FROM papers WHERE id=?)) WHERE id=?", (old, pid))
                for table in ("history", "recommendations"):
                    self.db.execute(f"DELETE FROM {table} WHERE paper_id=?", (old,))
                self.db.execute("DELETE FROM papers WHERE id=?", (old,))
                self.db.execute("INSERT INTO merged_ids VALUES(?,?)", (old, pid))
            data.update({k: v for k, v in paper.items() if v})
            self.db.execute("UPDATE papers SET data=?,title_key=?,last_seen=? WHERE id=?",
                            (json.dumps(data, ensure_ascii=False), key, stamp, pid))
        else:
            pid = self.db.execute("INSERT INTO papers(title_key,data,first_seen,last_seen) VALUES(?,?,?,?)",
                                  (key, json.dumps(paper, ensure_ascii=False), stamp, stamp)).lastrowid
        for alias in aliases:
            self.db.execute("INSERT OR IGNORE INTO aliases VALUES(?,?)", (alias, pid))
        payload = json.dumps(paper, sort_keys=True, ensure_ascii=False)
        fingerprint = hashlib.sha256(payload.encode()).hexdigest()
        self.db.execute("INSERT OR IGNORE INTO history VALUES(?,?,?,?)", (pid, fingerprint, stamp, payload))
        return pid

    def ingest(self, papers):
        if not isinstance(papers, list):
            raise ValueError("Input must be a JSON array")
        with self.db:
            self.db.execute("BEGIN IMMEDIATE")
            ids = [self._ingest(p) for p in papers]
            return [self.resolve(pid) for pid in ids]

    def remember(self, key, kind, text, status="active", reason=""):
        if kind not in ("interest", "idea", "feedback", "direction", "project", "result"):
            raise ValueError("Unknown memory kind")
        if status not in ("active", "liked", "rejected", "completed", "archived", "proposed"):
            raise ValueError("Unknown memory status")
        if not key.strip() or not text.strip():
            raise ValueError("Memory key and text must not be empty")
        stamp = now()
        with self.db:
            self.db.execute("INSERT OR REPLACE INTO memories VALUES(?,?,?,?,?,?)", (key, kind, text, status, reason, stamp))
            self.db.execute("INSERT INTO memory_history VALUES(?,?,?)",
                            (key, stamp, json.dumps(dict(kind=kind, text=text, status=status, reason=reason), ensure_ascii=False)))

    def context(self):
        return [dict(r) for r in self.db.execute("SELECT * FROM memories ORDER BY updated,key")]

    def candidates(self, limit=10):
        memories = self.context()
        positive = [m for m in memories if (m["kind"] in ("interest", "project") and m["status"] == "active") or m["status"] == "liked"]
        rejected = [m for m in memories if m["status"] == "rejected"]
        selected = []
        for row in self.db.execute("SELECT * FROM papers WHERE id NOT IN (SELECT paper_id FROM recommendations)"):
            p = json.loads(row["data"])
            haystack = " " + normalized(p["title"] + " " + p.get("abstract", "")) + " "
            def matched(m):
                return " " + normalized(m["text"]) + " " in haystack
            if any(matched(m) for m in rejected):
                continue
            reasons = [m["key"] for m in positive if matched(m)]
            if not reasons:
                continue
            topic_matches = sum(m["kind"] in ("interest", "project") and m["status"] == "active"
                                for m in positive if matched(m))
            selected.append(p | dict(paper_id=row["id"], relevance=len(reasons),
                                     topic_relevance=topic_matches, matched_memories=reasons,
                                     first_seen=row["first_seen"]))
        return sorted(selected, key=lambda p: (-p["topic_relevance"], -p["relevance"], -int(re.sub(r"\D", "", p.get("published", "")[:10]).ljust(8, "0")), p["paper_id"]))[:limit]

    def resolve(self, pid):
        while True:
            merged = self.db.execute("SELECT paper_id FROM merged_ids WHERE old_id=?", (pid,)).fetchone()
            if not merged:
                break
            pid = merged[0]
        return pid

    def paper(self, pid):
        pid = self.resolve(pid)
        row = self.db.execute("SELECT * FROM papers WHERE id=?", (pid,)).fetchone()
        if row is None:
            raise ValueError("Unknown paper ID")
        return dict(row) | {"data": json.loads(row["data"]),
                            "aliases": [r[0] for r in self.db.execute("SELECT alias FROM aliases WHERE paper_id=?", (pid,))],
                            "history": [dict(r) | {"data": json.loads(r["data"])} for r in self.db.execute("SELECT observed,data FROM history WHERE paper_id=? ORDER BY observed", (pid,))],
                            "recommended": [r[0] for r in self.db.execute("SELECT day FROM recommendations WHERE paper_id=?", (pid,))]}

    def migrate(self, legacy):
        """Copy legacy files without overwriting; recover explicit paper identifiers."""
        legacy = Path(legacy).expanduser().resolve()
        if not legacy.is_dir() or legacy == self.root.resolve():
            raise ValueError("Legacy source must be a different existing directory")
        for name in ("profile.md", "config.md"):
            source, target = legacy / name, self.root / name
            if source.is_file() and not target.exists():
                atomic_write(target, source.read_text(encoding="utf-8"))
        for source in sorted((legacy / "digests").glob("????-??-??.md")):
            day = date.fromisoformat(source.stem).isoformat()
            target = self.root / "digests" / source.name
            existing = self.db.execute("SELECT content FROM digests WHERE day=?", (day,)).fetchone()
            if existing:
                if not target.exists():
                    atomic_write(target, existing[0])
                continue
            content = source.read_text(encoding="utf-8")
            if target.exists() and target.read_text(encoding="utf-8") != content:
                raise ValueError("Conflicting digest already exists: " + str(target))
            papers = [{"title": "Legacy paper " + a, "arxiv_id": a} for a in re.findall(
                r"(?:arxiv.org/(?:abs|pdf)/|arxiv:\s*)(\d{4}\.\d{4,5}(?:v\d+)?|[a-z-]+(?:\.[A-Z]{2})?/\d{7}(?:v\d+)?)", content, re.I)]
            papers += [{"title": "Legacy paper " + d, "doi": d.rstrip(".,;")} for d in re.findall(r"https?://(?:dx\.)?doi.org/(10\.\d{4,9}/[^\s)<>\]]+)", content, re.I)]
            ids = self.ingest(papers)
            with self.db:
                for pid in set(ids):
                    self.db.execute("INSERT OR IGNORE INTO recommendations VALUES(?,?)", (pid, day))
                self.db.execute("INSERT INTO digests VALUES(?,?)", (day, content))
            if not target.exists():
                atomic_write(target, content)

    def publish(self, day, content, ids):
        if date.fromisoformat(day).isoformat() != day:
            raise ValueError("Date must be YYYY-MM-DD")
        if not content.strip():
            raise ValueError("Empty digest")
        with self.db:
            self.db.execute("BEGIN IMMEDIATE")
            existing = self.db.execute("SELECT content FROM digests WHERE day=?", (day,)).fetchone()
            if existing:
                content = existing[0]  # Retry repairs a missing file, without changing history.
            else:
                for pid in {self.resolve(pid) for pid in ids}:
                    self.paper(pid)
                    if self.db.execute("SELECT 1 FROM recommendations WHERE paper_id=?", (pid,)).fetchone():
                        raise ValueError(f"Paper {pid} was already recommended; reselect candidates")
                    self.db.execute("INSERT INTO recommendations VALUES(?,?)", (pid, day))
                self.db.execute("INSERT INTO digests VALUES(?,?)", (day, content))
        path = self.root / "digests" / (day + ".md")
        atomic_write(path, content)
        return str(path)


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("init"); p.add_argument("--migrate-legacy")
    p = sub.add_parser("context"); p.add_argument("--history", action="store_true")
    p = sub.add_parser("ingest"); p.add_argument("file")
    p = sub.add_parser("candidates"); p.add_argument("--limit", type=int, default=10)
    p = sub.add_parser("paper"); p.add_argument("id", type=int)
    p = sub.add_parser("remember")
    for name in ("key", "kind", "text"):
        p.add_argument(name)
    p.add_argument("--status", default="active"); p.add_argument("--reason", default="")
    p = sub.add_parser("publish")
    p.add_argument("file"); p.add_argument("--date", default=date.today().isoformat())
    p.add_argument("--ids", nargs="*", type=int, default=[])
    args = parser.parse_args()
    memory = Memory()
    try:
        if args.cmd == "init":
            config = memory.root / "config.json"
            if not config.exists():
                atomic_write(config, json.dumps({"arxiv_queries": [], "crossref_issns": [], "lookback_days": 7, "max_per_source": 100, "digest_limit": 10}, indent=2) + "\n")
            if args.migrate_legacy:
                memory.migrate(args.migrate_legacy)
            result = str(memory.root)
        elif args.cmd == "context":
            result = ([dict(r) | {"data": json.loads(r["data"])} for r in memory.db.execute("SELECT * FROM memory_history ORDER BY observed")] if args.history else memory.context())
        elif args.cmd == "paper": result = memory.paper(args.id)
        elif args.cmd == "ingest": result = memory.ingest(json.loads(Path(args.file).read_text(encoding="utf-8")))
        elif args.cmd == "candidates":
            if args.limit < 1: raise ValueError("limit must be positive")
            result = memory.candidates(args.limit)
        elif args.cmd == "remember":
            memory.remember(args.key, args.kind, args.text, args.status, args.reason)
            result = args.key
        else:
            result = memory.publish(args.date, Path(args.file).read_text(encoding="utf-8"), args.ids)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    finally:
        memory.close()


if __name__ == "__main__":
    main()
