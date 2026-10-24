# mikeyobrien/ralph-orchestrator

Copied from https://github.com/mikeyobrien/ralph-orchestrator (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [code-assist](code-assist/) | `.claude/skills/code-assist` | Guides implementation of code tasks using test-driven development in an Explore, Plan, Code, Commit workflow. Acts as a Technical Implementation Partner and TDD Coach — following existing patterns,… |
| [code-task-generator](code-task-generator/) | `.claude/skills/code-task-generator` | Generates structured .code-task.md files from descriptions or PDD implementation plans. Auto-detects input type, creates properly formatted tasks with Given-When-Then acceptance criteria. |
| [evaluate-presets](evaluate-presets/) | `.claude/skills/evaluate-presets` | Use when testing Ralph's hat collection presets, validating preset configurations, or auditing the preset library for bugs and UX issues. |
| [find-code-tasks](find-code-tasks/) | `.claude/skills/find-code-tasks` | Lists all code tasks in the repository with their status, dates, and metadata. Useful for getting an overview of pending work or finding specific tasks. |
| [pdd](pdd/) | `.claude/skills/pdd` | Transforms a rough idea into a detailed design document with implementation plan. Follows Prompt-Driven Development — iterative requirements clarification, research, design, and planning. |
| [playwriter](playwriter/) | `.claude/skills/playwriter` | Browser automation via Playwriter (remorses) using persistent Chrome sessions and the full Playwright Page API. |
| [pr-demo](pr-demo/) | `.claude/skills/pr-demo` | Use when creating animated demos (GIFs) for pull requests or documentation. Covers terminal recording with asciinema and conversion to GIF/SVG for GitHub embedding. |
| [ralph-docs](ralph-docs/) | `skills/ralph-docs` | Introspect, explain, and improve Ralph Orchestrator using its published llms.txt doc map. Use this skill whenever the user asks questions about Ralph's behavior, wants to understand how a Ralph int… |
| [ralph-hats](ralph-hats/) | `skills/ralph-hats` | Create, inspect, validate, explain, and improve Ralph hat collections. Use this skill whenever the user asks to make or refine a `.ralph/hats/*.yml` workflow, debug hat routing, explain event topol… |
| [ralph-loop](ralph-loop/) | `skills/ralph-loop` | Run, monitor, resume, merge, and debug Ralph loops. Use this skill whenever the user asks to operate `ralph run` or `ralph loops`, inspect loop state, recover suspended loops, analyze diagnostics,… |
| [ralph-tools](ralph-tools/) | `.claude/skills/ralph-tools` |  |
| [release-bump](release-bump/) | `.claude/skills/release-bump` | Use when bumping ralph-orchestrator version for a new release, after fixes are committed and ready to publish |
| [review-pr](review-pr/) | `.claude/skills/review-pr` | Use when asked to review a PR, run a code review loop, or invoke the ralph reviewer against a pull request number or GitHub URL |
| [test-driven-development](test-driven-development/) | `.claude/skills/test-driven-development` | Unified TDD skill with three input modes — from spec, from task, or from description. Enforces test-first development using repository patterns, with proptest guidance and backpressure integration. |
| [tmux-terminal](tmux-terminal/) | `.claude/skills/tmux-terminal` | Interactive terminal control via tmux for TUI apps, prompts, and long-running CLI workflows. |
| [tui-debug-in-pane](tui-debug-in-pane/) | `.claude/skills/tui-debug-in-pane` | Use when you need to reproduce or debug TUI rendering issues (garbled output, broken streaming, layout corruption) by running ralph in a tmux split pane and capturing live output. |
| [tui-validate](tui-validate/) | `.claude/skills/tui-validate` | Validates Terminal User Interface (TUI) output using freeze for screenshot capture and LLM-as-judge for semantic validation. Supports both visual (PNG/SVG) and text-based validation modes. |
