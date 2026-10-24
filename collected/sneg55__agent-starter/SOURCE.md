# sneg55/agent-starter

Copied from https://github.com/sneg55/agent-starter (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [adopt-project](adopt-project/) | `skills/adopt-project` | Apply agent-starter patterns to an EXISTING project - audits the codebase, proposes components by invasiveness tier (hooks, skills, CLAUDE.md, lint configs, patterns), and applies only what the dev… |
| [commit](commit/) | `skills/commit` | Create a single well-crafted git commit from current changes. Analyzes diff, follows repo's commit style, and writes a concise "why not what" message. |
| [commit-push-pr](commit-push-pr/) | `skills/commit-push-pr` | Full git workflow - creates branch, commits, pushes, and creates or updates a PR with summary and test plan. |
| [dream](dream/) | `skills/dream` | Memory consolidation - review, merge, prune, and index memory files. Run periodically to keep memories organized and up-to-date. |
| [new-project](new-project/) | `skills/new-project` | Full project bootstrap - interviews the developer (name, description, stack, components), then scaffolds directory structure, CLAUDE.md, config files, hooks, skills, and first commit. |
| [reflect](reflect/) | `skills/reflect` | Per-project self-improvement - reads the .harness ledger and feedback memories, then proposes gated rule/threshold/ADR changes so the project stops repeating mistakes. Run periodically. |
| [remember](remember/) | `skills/remember` | Review auto-memory entries and propose promotions to CLAUDE.md, CLAUDE.local.md, or shared memory. Also detects outdated, conflicting, and duplicate entries across memory layers. |
| [simplify](simplify/) | `skills/simplify` | Review changed code for reuse, quality, and efficiency, then fix any issues found. |
