#!/usr/bin/env python3
"""Bounded, non-agent daily discovery. No shell commands, plugins, or model calls."""
from datetime import date, datetime, timedelta, timezone
import fcntl
import html
import json
import os
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
from junshi import Memory, identifiers


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("API redirects are disabled")


def fetch(base, params):
    if base not in ("https://export.arxiv.org/api/query", "https://api.crossref.org/works"):
        raise ValueError("Source is not allowlisted")
    request = Request(base + "?" + urlencode(params), headers={"User-Agent": "Junshi/1.0 (https://github.com/junshi-research/research-junshi)"})
    for attempt in range(3):
        try:
            with build_opener(NoRedirect()).open(request, timeout=20) as response:
                body = response.read(8 * 1024 * 1024 + 1)
                if len(body) > 8 * 1024 * 1024:
                    raise ValueError("API response exceeds 8 MiB")
                return body
        except (HTTPError, URLError, TimeoutError) as exc:
            if isinstance(exc, HTTPError) and exc.code not in (429, 500, 502, 503, 504):
                raise
            if attempt == 2:
                raise
            time.sleep(3 * (attempt + 1))


def parse_arxiv(body):
    ns = {"a": "http://www.w3.org/2005/Atom", "x": "http://arxiv.org/schemas/atom",
          "o": "http://a9.com/-/spec/opensearch/1.1/"}
    root = ET.fromstring(body)
    if root.tag != "{" + ns["a"] + "}feed":
        raise ValueError("Unexpected arXiv response")
    papers = []
    for entry in root.findall("a:entry", ns):
        def get(tag):
            return " ".join(entry.findtext(tag, default="", namespaces=ns).split())
        if get("a:id").endswith("/errors"):
            raise ValueError("arXiv rejected the query: " + get("a:summary"))
        papers.append(dict(title=get("a:title"), abstract=get("a:summary"),
                           authors=[a.text or "" for a in entry.findall("a:author/a:name", ns)],
                           arxiv_id=get("a:id"), doi=get("x:doi"), url=get("a:id").replace("http:", "https:"),
                           venue=get("x:journal_ref"), published=get("a:published")[:10], updated=get("a:updated")[:10],
                           categories=[a.get("term", "") for a in entry.findall("a:category", ns)], source="arxiv"))
    return papers, int(root.findtext("o:totalResults", str(len(papers)), ns))


def parse_crossref(body):
    data = json.loads(body)
    if data.get("status") != "ok" or "items" not in data.get("message", {}):
        raise ValueError("Unexpected Crossref response")
    papers = []
    for item in data["message"]["items"]:
        parts = item.get("published", {}).get("date-parts", [[]])[0]
        published = "-".join(str(p).zfill(2) for p in parts)
        papers.append(dict(title=" ".join(item.get("title", [])), doi=item.get("DOI", ""),
                           authors=[" ".join(filter(None, [a.get("given"), a.get("family")])) or a.get("name", "") for a in item.get("author", [])],
                           abstract=html.unescape(re.sub(r"<[^>]*>", " ", item.get("abstract", ""))),
                           venue="; ".join(item.get("container-title", [])), published=published,
                           url=item.get("URL", ""), source="crossref"))
    return papers, int(data["message"]["total-results"])


def validate_config(config):
    for field, low, high in (("lookback_days", 1, 365), ("max_per_source", 1, 200), ("digest_limit", 1, 50)):
        if type(config.get(field)) is not int or not low <= config[field] <= high:
            raise ValueError(f"{field} must be an integer between {low} and {high}")
    for field in ("arxiv_queries", "crossref_issns"):
        if not isinstance(config.get(field), list) or any(not isinstance(v, str) or not v.strip() for v in config[field]):
            raise ValueError(field + " must be a list of nonempty strings")
    if not 1 <= len(config["arxiv_queries"]) + len(config["crossref_issns"]) <= 10:
        raise ValueError("Configure between 1 and 10 discovery sources")
    if any(len(q) > 1000 for q in config["arxiv_queries"]):
        raise ValueError("arXiv queries must be at most 1000 characters")
    if any(not re.fullmatch(r"\d{4}-\d{3}[\dX]", issn) for issn in config["crossref_issns"]):
        raise ValueError("Invalid Crossref ISSN")


def discover(config):
    validate_config(config)
    since = (datetime.now(timezone.utc).date() - timedelta(days=config["lookback_days"])).isoformat()
    cap = config["max_per_source"]
    papers, coverage = [], []
    for i, query in enumerate(config["arxiv_queries"]):
        if i:
            time.sleep(3)
        batch, total = parse_arxiv(fetch("https://export.arxiv.org/api/query", {
            "search_query": query, "start": 0, "max_results": cap,
            "sortBy": "lastUpdatedDate", "sortOrder": "descending"}))
        recent = [p for p in batch if p["updated"] >= since]
        papers.extend(recent)
        capped = total > len(batch) and len(recent) == len(batch)
        coverage.append(f"arXiv query {i + 1}: {len(recent)} recent records" + ("; CAP REACHED — narrow the query" if capped else ""))
    for issn in config["crossref_issns"]:
        batch, total = parse_crossref(fetch("https://api.crossref.org/works", {
            "filter": f"issn:{issn},from-index-date:{since}", "rows": cap, "sort": "indexed", "order": "desc"}))
        papers.extend(batch)
        coverage.append(f"Crossref ISSN {issn}: {len(batch)} of {total} indexed records" + ("; CAP REACHED" if total > len(batch) else ""))
    return papers, coverage


def plain(text):
    # Remote metadata is displayed as text, never executable Markdown/HTML.
    return html.escape(re.sub(r"([\\`*_[\]{}()!#<>|])", r"\\\1", " ".join(text.split())))


def render(day, selected, coverage):
    lines = [f"# Research Digest — {day}", "", "Automated metadata digest. New to your reading history; publication dates are shown below.",
             "", "## Coverage", "", *["- " + plain(c) for c in coverage], "", "## New relevant papers", ""]
    if not selected:
        lines += ["No unseen papers matched your active interests/projects or liked feedback. No repeats added.", ""]
    for p in selected:
        lines += [f"### {plain(p['title'])}", "", f"Paper ID: {p['paper_id']} · Published: {plain(p.get('published') or 'unknown')} · Source: {plain(p.get('source', 'import'))}",
                  "", "Authors: " + plain(", ".join(p.get("authors", []))),
                  "Venue: " + plain(p.get("venue") or "preprint / unspecified"),
                  "Relevance: " + plain(", ".join(p["matched_memories"])), ""]
        for alias in sorted(identifiers(p)):
            kind, value = alias.split(":", 1)
            url = ("https://doi.org/" if kind == "doi" else "https://arxiv.org/abs/") + quote(value, safe="/")
            lines += [f"[{kind}]({url})", ""]
        lines += ["Abstract: " + plain(p.get("abstract") or "Not supplied by the source; read the linked paper before drawing conclusions."), ""]
    lines += ["## Next step", "", "Ask research-junshi in Claude Code or Codex to develop ideas from this digest and your research memory.", ""]
    return "\n".join(lines)


def run(memory, config, day=None):
    day = day or date.today().isoformat()
    existing = memory.db.execute("SELECT content FROM digests WHERE day=?", (day,)).fetchone()
    if existing:
        return memory.publish(day, existing[0], [])
    if not any((m["kind"] in ("interest", "project") and m["status"] == "active") or m["status"] == "liked" for m in memory.context()):
        raise ValueError("Add at least one active interest/project or liked memory before automation")
    papers, coverage = discover(config)
    memory.ingest(papers)
    selected = memory.candidates(config["digest_limit"])
    return memory.publish(day, render(day, selected, coverage), [p["paper_id"] for p in selected])


def main():
    os.umask(0o077)
    memory = Memory()
    try:
        with (memory.root / ".daily.lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            config = json.loads((memory.root / "config.json").read_text(encoding="utf-8"))
            print(run(memory, config))
    finally:
        memory.close()


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, ET.ParseError) as exc:
        print(f"Junshi daily run failed: {exc}", file=sys.stderr)
        sys.exit(1)
