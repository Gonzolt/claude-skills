# mag123c/toktrack

Copied from https://github.com/mag123c/toktrack (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [clarify](clarify/) | `.claude/skills/clarify` | Adaptive requirements clarification with auto-depth routing. Shallow (Q&A) for simple tasks, Deep (exploration + DRAFT + PLAN) for complex ones. Escalates automatically when ambiguity persists. |
| [implement](implement/) | `.claude/skills/implement` | TDD implementation (RED→GREEN→REFACTOR) → verify → review |
| [next](next/) | `.claude/skills/next` | Session start - check progress, suggest next task |
| [review](review/) | `.claude/skills/review` | Multi-agent code review for Rust CLI/TUI. UX Review inactive (terminal UI — no web frontend). Code Review only. Includes Rust/clippy-specific checklist. |
| [verify](verify/) | `.claude/skills/verify` | Self-healing verification loop (test → clippy → fmt) |
| [wrap](wrap/) | `.claude/skills/wrap` | Session end - document updates, commit |
