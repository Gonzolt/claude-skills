# Shared research memory

Python 3.9+, standard library only. Run commands from the skill directory, or use the script's absolute path. Set `JUNSHI_HOME` consistently to change the default `~/.junshi`.

```bash
python3 scripts/junshi.py init
python3 scripts/junshi.py remember causal interest 'causal inference'
python3 scripts/junshi.py remember panel project 'synthetic control' --reason 'Active project: high-dimensional donors; one GPU and six months'
python3 scripts/junshi.py remember costly direction 'large language model training' --status rejected --reason 'User: exceeds compute budget'
python3 scripts/junshi.py remember theory feedback 'finite sample' --status liked --reason 'User prefers guarantees to leaderboard gains'
python3 scripts/junshi.py remember panel-idea idea 'Debiased donor weights' --status proposed --reason 'Project panel; paper 1; N=4 F=4 I=3; score=3.7; first test: simulated coverage'
python3 scripts/junshi.py context
python3 scripts/junshi.py context --history
```

`remember KEY KIND TEXT` accepts kinds `interest`, `project`, `idea`, `feedback`, `direction`, `result`; statuses `active`, `liked`, `rejected`, `completed`, `archived`, `proposed`. Reusing a key updates its current value and appends history. Archive an interest with the same key/text and `--status archived`. Text should be a short topic phrase in the literature's language; reason stores freeform context, user provenance, constraints, and references. User-confirmed feedback updates taste; proposed ideas/preferences do not count as positive signals.

Selection counts normalized whole-phrase matches in title/abstract. It ranks active interest/project matches first, then total matches including liked entries, then publication date and ID. It excludes rejected phrases and every previously recommended canonical paper. A broad taste preference alone cannot outrank a direct match to the researcher’s current topics. This is transparent lexical filtering, not semantic learning; interactive agents use the full profile and memory for nuanced personalization. Add synonyms as separate interest entries when useful. To reject one paper, save its full title as a rejected feedback entry. Previously recommended works remain excluded even if a preference changes; explicit revisits belong in attended analysis.

## Discovery configuration

Edit the generated `config.json`, for example:

```json
{
  "arxiv_queries": ["cat:stat.ME", "au:\"Susan Athey\""],
  "crossref_issns": ["0090-5364"],
  "lookback_days": 7,
  "max_per_source": 100,
  "digest_limit": 10
}
```

Use categories and tracked authors, not just problem keywords. Verify journal ISSNs from publisher metadata. The collector reads arXiv's latest updated records and Crossref's recently indexed journal records over an overlapping window (UTC). An older publication can be newly indexed. Caps are reported and can miss papers in busy sources; narrow queries, run interactive follow-up searches, or increase the cap (maximum 200/source, 10 sources, 365-day lookback). This is a bounded discovery pipeline, not a complete archive or citation-graph service. Conferences without Crossref journal coverage need interactive proceedings discovery using `venues.md`. Feed specifications: [arXiv API](https://info.arxiv.org/help/api/user-manual.html), [Crossref REST API](https://github.com/CrossRef/rest-api-doc).

In an interactive host, fetch and import configured sources without publishing:

```python
# Run from scripts/, using the same JUNSHI_HOME as the host.
import json
from daily import discover
from junshi import Memory
m = Memory()
try:
    papers, coverage = discover(json.loads((m.root / "config.json").read_text()))
    ids = m.ingest(papers)
    print(json.dumps({"ids": ids, "coverage": coverage, "candidates": m.candidates()}, indent=2))
finally:
    m.close()
```

## Paper metadata and history

Import a JSON array from any verified discovery source:

```json
[
  {
    "title": "An illustrative causal inference paper",
    "authors": ["Example Researcher"],
    "abstract": "An illustrative abstract about causal inference.",
    "arxiv_id": "2601.00001v1",
    "doi": "10.1234/example",
    "venue": "Example Journal",
    "published": "2026-01-01",
    "updated": "2026-01-03",
    "source": "publisher",
    "url": "https://example.org/paper"
  }
]
```

These identifiers are illustrative, not real citations. Required: title and either DOI, arXiv ID, or authors. Preserve the supplied arXiv version in metadata; identity strips the version. The record retains source URLs, dates, venue, abstract, authors, and optional categories. Exact DOI/arXiv aliases identify a work. Exact normalized title plus a shared full author name is a fallback only when it identifies a single existing record. Ambiguous titles stay separate; renamed versions need verified common IDs. A bridge record carrying both IDs merges earlier records, histories, and recommendation dates. No fuzzy title matching is applied. Each distinct observed metadata payload is preserved; `first_seen`/`last_seen` track discovery independently of publication dates.

```bash
python3 scripts/junshi.py ingest /path/to/papers.json
python3 scripts/junshi.py candidates --limit 10
python3 scripts/junshi.py paper 1
python3 scripts/junshi.py publish /path/to/digest-draft.md --date 2026-09-17 --ids 1 2
```

`ingest` prints canonical integer IDs. Merged IDs continue to resolve to the canonical record and are never reused for a different paper. Query candidates again after importing bridge records. `publish` validates IDs and prevents repeat recommendations. Only selected IDs are marked, never every discovered paper. The digest content and recommendation IDs commit in one SQLite transaction, then the Markdown is atomically exported. If file export fails, repeat the same publish command (or daily run on the same date) to restore the committed digest. Publication dates are immutable; manual additions go in a separate `YYYY-MM-DD-ideas.md` file.

## Data and migration

```text
~/.junshi/
├── profile.md            # Human-readable synthesis, maintained by the agent
├── config.json           # Fixed collector sources and limits
├── memory.sqlite3        # Papers, aliases, history, memory, published digests
├── digests/              # Markdown exports and attended idea analyses
└── cron-junshi.log       # Created by scheduled runs
```

`init` never replaces existing configuration. Migrate an old Claude store explicitly:

```bash
python3 scripts/junshi.py init --migrate-legacy "$HOME/.claude/research-junshi"
```

Migration copies `profile.md`/`config.md` without overwriting files and imports dated digests. It recovers explicit arXiv URLs/`arXiv:` IDs and DOI URLs into recommendation history. Old digests containing only titles or bare IDs need manual identity reconciliation; their suppression cannot be guaranteed. The source store is preserved. The agent must translate old `config.md` to `config.json` and record the profile's active interests before scheduling. Afterward, replace the old cron job with `setup_automation.sh`; the legacy store is no longer read automatically.

The SQLite schema and all JSON/Markdown formats are host-independent. Back up the entire data directory while no run is active. It contains private ideas and feedback: do not commit it, publish it, or put it inside the skill installation. Archiving a memory preserves history; deleting the data directory explicitly resets memory. No cloud synchronization or hidden model training is performed.
