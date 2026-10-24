# sara-star-quant/presence

Copied from https://github.com/sara-star-quant/presence (license: **Apache-2.0**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [confidence-gate](confidence-gate/) | `skills/confidence-gate` | When you're about to claim success ("fixed", "done", "works", "passing tests") at the end of a turn, verify the claim is backed by actual evidence in this session. presence's Stop hook will flag a… |
| [outcome-check](outcome-check/) | `skills/outcome-check` | When you're about to claim a previous fix worked, or are tempted to repeat an approach Claude Code has tried in this repo before, consult the outcome telemetry. presence tracks every commit Claude… |
| [project-model](project-model/) | `skills/project-model` | When working in a codebase you've touched before, consult and update the persistent project model maintained by presence. The model lives at ~/.claude/presence/projects/<repo-id>/model.md and conta… |
