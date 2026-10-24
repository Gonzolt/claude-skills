# ferrumclaudepilgrim/claude-code-android

Copied from https://github.com/ferrumclaudepilgrim/claude-code-android (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [minimum-viable](minimum-viable/) | `.claude/skills/minimum-viable` | Before building anything, justify the tool choice and complexity level. Could a shell script do this? Does it need Node.js? A full application? Prevents over-engineering by requiring explicit justi… |
| [scope-framing](scope-framing/) | `.claude/skills/scope-framing` | Before starting any research task, define what decision the research serves, what "done" looks like, and what is out of scope. Prevents research that answers the technically correct question but no… |
| [termux-safe](termux-safe/) | `.claude/skills/termux-safe` | Android/Termux constraints reference. Prevents Claude Code from suggesting commands that fail silently on Android (sudo, systemd, non-Termux paths, etc.). |
