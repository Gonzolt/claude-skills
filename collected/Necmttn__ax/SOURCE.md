# Necmttn/ax

Copied from https://github.com/Necmttn/ax (license: **AGPL-3.0**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [ax-add-ingest-stage](ax-add-ingest-stage/) | `.ax/skills/ax-add-ingest-stage` | Use when adding a new ingest stage or a new SurrealDB table to the ax graph. Encodes the exact registration gotchas that fail CI if missed. |
| [ax-extract-workflow](ax-extract-workflow/) | `skills/ax-extract-workflow` | Reconstruct the workflow behind a past artifact - "what made X work" / "extract workflow from <date\|sha>" / "how did we ship Y". Uses ax to find the relevant sessions and narrate the ordered skill… |
| [ax-repo](ax-repo/) | `skills/ax-repo` | Star the ax repo, file an issue / bug report, or fork-and-open-a-PR against github.com/Necmttn/ax on the user's behalf, by shelling out to the `gh` CLI. Triggers when the user says "star ax", "star… |
| [dojo](dojo/) | `skills/dojo` | Surplus-quota training loop over the ax graph - the agent burns the remaining 5h/7d plan-quota window on self-improvement: locking pending verdicts, filling briefs, backtesting routing classes, min… |
| [efficient-dispatch](efficient-dispatch/) | `skills/efficient-dispatch` | Model-routing orchestration for any expensive frontier model (Fable, Opus, GPT-5.x) - the main model keeps judgment and Q&A review, mechanical subagent dispatches carry an explicit cheaper model, a… |
| [narrate](narrate/) | `skills/narrate` | Write the agent-generated narration of the current session - the reviewable story of what changed, including what never reaches a PR (user corrections, abandoned attempts, tool failures). Triggers… |
| [release-announcement](release-announcement/) | `skills/release-announcement` | Draft or revise ax release announcements and website changelog pages. Triggers when the user says "write release notes", "draft release announcement", "prepare changelog", "release page", "version… |
| [retro](retro/) | `skills/retro` | Guided experiment-loop retrospective over the ax agent-experience graph. Walks the user through their open proposals (accept-with-scaffold or reject), pending verdicts (confirm the suggested verdic… |
| [retro-meta](retro-meta/) | `skills/retro-meta` | Deep retro of retros - investigation pass that surfaces improvements across older retros and the current ax setup. External AI agent drives the reasoning with high thinking enabled. Triggers when u… |
| [setup](setup/) | `skills/setup` | Install + verify ax (the agent experience layer). Triggers when the user says "install ax", "set up ax", "ax not found", "ax doctor", "is ax running", "fix ax install", "first-time ax setup", or an… |
| [ship-checklist](ship-checklist/) | `skills/ship-checklist` | Definition-of-done checklist for shipping a new write, signal, table, edge, or query to the ax graph. Use when adding a SurrealDB table/edge/field, an ingest derive-stage, a new analytic query, or… |
| [tune](tune/) | `skills/tune` | Retrospective on one coding session that proposes changes to the agent's environment (hooks, checks, steering files, tool access) and files each as an ax proposal. Reads the raw session log through… |
