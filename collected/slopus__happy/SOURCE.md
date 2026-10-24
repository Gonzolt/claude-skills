# slopus/happy

Copied from https://github.com/slopus/happy (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [agent-browser](agent-browser/) | `.agents/skills/agent-browser` | Browser automation CLI for AI agents. Use this when asked to test something in a real browser. |
| [control-flow](control-flow/) | `.agents/skills/control-flow` | Analyze and design control flows and data structures. Produces compact ASCII tree diagrams showing triggers, call chains, payload shapes, state mutations, and re-render effects. Use when user asks… |
| [dev](dev/) | `.agents/skills/dev` | Local development guide for the Happy monorepo. How to build, install, test, and run the CLI, server, mobile app, and desktop (Tauri) locally. Use when the user types /dev, asks how to "build", "st… |
| [maintain](maintain/) | `.agents/skills/maintain` | Maintain the slopus/happy open source project. Triage issues, draft closing comments, find duplicates, check if bugs are fixed on main, and engage with community contributors. NEVER posts comments… |
| [metrics-graphana](metrics-graphana/) | `.agents/skills/metrics-graphana` | Query and manage Grafana dashboards and Prometheus metrics for Happy infrastructure. Covers grafanactl CLI usage, direct Prometheus queries through Grafana proxy, and dashboard-as-code workflows. U… |
| [office-hours](office-hours/) | `.agents/skills/office-hours` | MANUAL TRIGGER ONLY: invoke only when user types /office-hours. YC Office Hours — two modes. Startup mode: six forcing questions that expose demand reality, status quo, desperate specificity, narro… |
| [release](release/) | `.agents/skills/release` | Release pipeline for CLI, mobile, web, and server. Guides through version bumping, building, testing, publishing, and deploying. Replaces the old interactive release-it flow with a Claude Code-nati… |
| [sessions](sessions/) | `.agents/skills/sessions` | Search and ask questions about coding agent session history across Claude Code, Codex, and Cursor. Use when asking what was worked on, what was tried before, how a problem was investigated across s… |
| [terminal-emulator](terminal-emulator/) | `.agents/skills/terminal-emulator` | Test interactive CLI/TUI applications using @microsoft/tui-test. Use when you need to test CLI tools with interactive prompts, TUI rendering, arrow key navigation, or any command that requires a TT… |
