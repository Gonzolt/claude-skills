# 🪭 Junshi (军师)

**Your personalized research strategist — across Claude Code and Codex.**

*Not just what's new. What's new for you.*

Junshi reads your papers, remembers your research interests and feedback, tracks relevant literature, and proposes ranked directions with a first experiment and a main risk. The product is **Junshi (军师)**; the Agent Skills name is **`research-junshi`**.

It works across academic fields, including machine learning, statistics, economics, biology, physics, and robotics. You stay the researcher; Junshi connects your past work to new evidence.

## Adoption and ecosystem visibility

Junshi is listed in community skill directories and marketplaces:

- [Awesome Claude Skills](https://github.com/BehiSecc/awesome-claude-skills#-scientific--research-tools) — **10,000+ GitHub stars**
- [MCP App Store](https://mcpapp-store.com/skills?page=2&sort=updated&tag=research)

*Listings and the directory repository's star count checked on September 17, 2026.*

## What you get

- **Reliable literature memory:** structured metadata, source/version history, DOI/arXiv and conservative title/author deduplication, and persistent recommendation history. Venue versions do not automatically become repeat recommendations.
- **Research taste over time:** shared interests, active projects, preliminary results, previous ideas, liked feedback, and rejected directions, with revision history and explicit user corrections.
- **Actionable ideas:** interactive agents produce up to 3–5 ranked directions, tied to your work, resources, and the literature.
- **Safer daily collection:** a fixed Python collector generates personalized metadata digests without agent execution or permission bypasses. Full idea generation runs in your normal interactive agent session.

## Installation

Requires **Python 3.9+** (no pip dependencies). Optional PDF extraction: `brew install poppler` on macOS or `sudo apt install poppler-utils` on Linux.

### Claude Code

```bash
git clone https://github.com/junshi-research/research-junshi.git "$HOME/.claude/skills/research-junshi"
```

Open a new Claude Code session and invoke `/research-junshi` or say “Run research-junshi.” This is a skill installation; no plugin marketplace setup is required. See [Claude Code skills](https://code.claude.com/docs/en/skills).

### Codex

```bash
git clone https://github.com/junshi-research/research-junshi.git "$HOME/.agents/skills/research-junshi"
```

Invoke **`$research-junshi`** in Codex. If it does not appear, restart the session. The same root skill includes Codex UI metadata; no separate fork is needed. The user skill directory follows the [official Codex documentation](https://learn.chatgpt.com/docs/build-skills).

For an already downloaded ZIP, put the extracted **whole folder** at either installation path above, named `research-junshi`. Keep `scripts/`, `references/`, and `agents/` beside `SKILL.md`. Both installations share data through `JUNSHI_HOME` (default `~/.junshi`); keep them on the same repo revision. Other Agent Skills hosts can map their tools using [the adapter reference](references/agents.md).

## Usage

On the first run, describe your situation:

```text
I work on causal inference and econometrics. My papers are in ~/papers/.
I'm studying high-dimensional confounders and have one GPU.
Run research-junshi.
```

The agent reads your papers, builds a profile, configures sources, and records interests/projects in shared memory. It suggests venues when needed and labels inferred preferences. Then ask:

```text
Give me today's research digest.
Remember that I prefer finite-sample guarantees.
Reject large language model training: it exceeds my compute budget.
My synthetic-control project is now complete.
Develop research ideas from today's automated digest.
```

A ranked idea includes a pitch, cited motivation, connection to your work, first experiment, main risk, and a score: **novelty × 0.4 + feasibility × 0.3 + impact × 0.3**. Prior ideas and rejection reasons guide subsequent suggestions; proposed ideas are not automatically treated as endorsements.

## Daily automation

On macOS or Linux, complete an interactive first run, then run this from the installed skill folder:

```bash
python3 scripts/daily.py       # Verify sources and inspect the first digest
bash setup_automation.sh       # Preview and confirm a daily cron entry
```

The setup script schedules the shared collector, so it works independently of Claude Code or Codex and needs no model credentials. The machine must be awake with network access. It saves `~/.junshi/digests/YYYY-MM-DD.md`; cron logs go to `~/.junshi/cron-junshi.log`. Scheduling and filenames use your machine's timezone. Repeating a date restores its recorded digest without consuming more papers.

Unattended output contains unseen, relevant papers, abstract excerpts, publication dates, matching research interests, and coverage notes. It does **not** generate research ideas: ask your interactive agent to add an analysis in `YYYY-MM-DD-ideas.md`. Source failures stop publication and log an error; empty successful searches produce an honest empty digest. Inspect the log periodically.

Discovery uses arXiv categories/authors and Crossref journal ISSNs, with an overlapping lookback window. Interactive agents supplement this with venue proceedings and seed-paper references/citations. Source caps are explicit, conference coverage is not automatic, and phrase matching is intentionally simple; this is not an exhaustive literature index. See [configuration and memory commands](references/memory.md) and [security boundaries](references/security.md).

**Upgrading existing users:** migrate the old store and replace the old cron job:

```bash
python3 scripts/junshi.py init --migrate-legacy "$HOME/.claude/research-junshi"
```

Ask the agent to translate the copied `config.md` into `config.json` and seed active interests from the profile, then run `setup_automation.sh`. Migration preserves the old files and recovers explicit arXiv/DOI links from digests; title-only history needs manual reconciliation. Updating the repo alone does not remove a previously installed unsafe cron job.

## Development

```bash
python3 -m unittest discover -s tests -v
bash -n setup_automation.sh
```

Tests use temporary stores, fixture metadata, and a fake crontab; they make no network/model calls and install no real schedule. Change the shared workflow once to improve both hosts. No framework, vector database, or duplicated agent-specific research implementation is required.

Apache-2.0 licensed. Issues and focused PRs are welcome.
