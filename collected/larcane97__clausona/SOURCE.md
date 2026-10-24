# larcane97/clausona

Copied from https://github.com/larcane97/clausona (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [fleet-core](fleet-core/) | `plugins/fleet-core/skills/fleet-core` | Shared rules for the clausona fleet skills (superset-fleet, herdr-fleet, orca-fleet, tmux-fleet). Load it only when one of those skills tells you to; it is not a task on its own. |
| [herdr-fleet](herdr-fleet/) | `plugins/herdr-fleet/skills/herdr-fleet` | Run several coding agents in parallel in herdr panes, each under its own clausona profile (another Claude Code or Codex account, or an API model such as GLM or DeepSeek), then watch them, check the… |
| [orca-fleet](orca-fleet/) | `plugins/orca-fleet/skills/orca-fleet` | Run several coding agents in parallel in Orca worktrees, each under its own clausona profile (another Claude Code or Codex account, or an API model such as GLM or DeepSeek), then watch them, check… |
| [routing](routing/) | `plugins/routing/skills/routing` | Run Claude Code or Codex on whichever clausona account has quota left, using clausona routes, and create, change or explain those routes, and the dir rules and defaults that pick one for a plain `c… |
| [superset-fleet](superset-fleet/) | `plugins/superset-fleet/skills/superset-fleet` | Run several coding agents in parallel in Superset workspaces, each under its own clausona profile (another Claude Code or Codex account, or an API model such as GLM or DeepSeek), then watch them, c… |
| [tmux-fleet](tmux-fleet/) | `plugins/tmux-fleet/skills/tmux-fleet` | Run several coding agents in parallel in tmux windows, each under its own clausona profile (another Claude Code or Codex account, or an API model such as GLM or DeepSeek), then watch them, check th… |
