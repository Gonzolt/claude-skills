# NahumLitvin/prismantis

Copied from https://github.com/NahumLitvin/prismantis (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [add-theme](add-theme/) | `.claude/skills/add-theme` | Add, rename or update a prismantis color preset from an existing theme (Dracula, Nord, a VS Code theme, ...). Use when someone says "add a theme", "support <theme name>", "new palette" or "rename a… |
| [demo](demo/) | `.claude/skills/demo` | Print the prismantis demo reply to eyeball every rendering feature after a change. Use after any visual change, when asked for "the demo", "show all features", "visual test", or before a release sc… |
| [drive-check](drive-check/) | `.claude/skills/drive-check` | Drive an interactive prismantis surface (the setup pane, buttons, anything with keys or Enter) like a person would, in a real Claude Code session, and look for bugs. Use before merging a change to… |
| [live-check](live-check/) | `.claude/skills/live-check` | Load the working copy of prismantis into a real Claude Code session and render how replies draw, with no screenshot. Use after any visual change, when asked to "screenshot", "see it", "try it live"… |
| [prismantis](prismantis/) | `codex/skills/prismantis` | Show the prismantis demo. Use when the user runs $prismantis or asks what prismantis is or does. |
| [prismantis-themes](prismantis-themes/) | `codex/skills/prismantis-themes` | Install the prismantis color themes for code and diagrams. Use when the user runs $prismantis-themes or asks for prismantis themes in Codex. |
| [release](release/) | `.claude/skills/release` | Cut a prismantis release - version bump, changelog, verify, tag and push. Use when asked to "release", "bump the version", "ship 0.x" or "publish". |
