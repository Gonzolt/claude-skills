# garrytan/gstack

Copied from https://github.com/garrytan/gstack (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [autoplan](autoplan/) | `autoplan` | Auto-review pipeline — reads the full CEO, design, eng, and DX review skills from disk and runs them sequentially with auto-decisions using 6 decision principles. (gstack) |
| [benchmark](benchmark/) | `benchmark` | Web performance regression detection. (gstack) |
| [benchmark-models](benchmark-models/) | `benchmark-models` | Cross-model benchmark for gstack skills. (gstack) |
| [browse](browse/) | `browse` | Drive a real browser through Aside: open a page, read it, click through a flow, take screenshots, check console errors. (gstack) |
| [canary](canary/) | `canary` | Post-deploy canary monitoring. (gstack) |
| [careful](careful/) | `careful` | Safety guardrails for destructive commands. (gstack) |
| [codex](codex/) | `codex` | OpenAI Codex CLI wrapper — three modes. (gstack) |
| [context-restore](context-restore/) | `context-restore` | Restore working context saved earlier by /context-save. (gstack) |
| [context-save](context-save/) | `context-save` | Save working context. (gstack) |
| [cso](cso/) | `cso` | Security audit: supported static findings; qualified profiles add reproduction and repair candidates. (gstack) |
| [design-consultation](design-consultation/) | `design-consultation` | Design consultation: understands your product, researches the landscape, proposes a complete design system (aesthetic, typography, color, layout, spacing, motion), and generates font+color preview.… |
| [design-html](design-html/) | `design-html` | Design finalization: generates production-quality Pretext-native HTML/CSS. (gstack) |
| [design-review](design-review/) | `design-review` | Designer's eye QA: finds visual inconsistency, spacing issues, hierarchy problems, AI slop patterns, and slow interactions — then fixes them. (gstack) |
| [design-shotgun](design-shotgun/) | `design-shotgun` | Design shotgun: generate multiple AI design variants, open a comparison board, collect structured feedback, and iterate. (gstack) |
| [deslop-shared-libs](deslop-shared-libs/) | `deslop-shared-libs` | Find worthwhile shared-code extractions in recent work. (gstack) |
| [devex-review](devex-review/) | `devex-review` | Live developer experience audit. (gstack) |
| [diagram](diagram/) | `diagram` | Turn an English description (or mermaid source) into a diagram triplet: the source, an editable .excalidraw file you can open on excalidraw.com, and rendered SVG + PNG. (gstack) |
| [document-generate](document-generate/) | `document-generate` | Generate missing documentation from scratch for a feature, module, or entire project. (gstack) |
| [document-release](document-release/) | `document-release` | Release documentation audit. (gstack) |
| [eval-plan](eval-plan/) | `eval-plan` | Preregister a paid eval (bars, arms, decoys, stop rules), dry-run it at zero cost, then run a three-item priced pilot whose spend table gates approval. (gstack) |
| [freeze](freeze/) | `freeze` | Restrict file edits to a specific directory for the session. (gstack) |
| [gstack](gstack/) | `capy/skill/gstack` | Install and use gstack in Capy and Claude Code. Load at session start to check this machine, and for gstack planning, code review, debugging, QA, design, security, documentation, and shipping workf… |
| [gstack-openclaw-ceo-review](gstack-openclaw-ceo-review/) | `openclaw/skills/gstack-openclaw-ceo-review` | Use when asked to review a plan, challenge a proposal, run a CEO review, poke holes in an approach, think bigger about scope, or decide whether to expand or reduce the plan. |
| [gstack-openclaw-investigate](gstack-openclaw-investigate/) | `openclaw/skills/gstack-openclaw-investigate` | Use when asked to debug, fix a bug, investigate an error, or do root cause analysis, and when users report errors, stack traces, unexpected behavior, or say something stopped working. |
| [gstack-openclaw-office-hours](gstack-openclaw-office-hours/) | `openclaw/skills/gstack-openclaw-office-hours` | Use when asked to brainstorm, evaluate whether an idea is worth building, run office hours, or think through a new product idea or design direction before any code is written. |
| [gstack-openclaw-retro](gstack-openclaw-retro/) | `openclaw/skills/gstack-openclaw-retro` | Weekly engineering retrospective. Analyzes commit history, work patterns, and code quality metrics with persistent history and trend tracking. Team-aware with per-person contributions, praise, and… |
| [gstack-upgrade](gstack-upgrade/) | `gstack-upgrade` | Upgrade gstack to the latest version. |
| [guard](guard/) | `guard` | Full safety mode: destructive command warnings + directory-scoped edits. (gstack) |
| [hackernews-frontpage](hackernews-frontpage/) | `browser-skills/hackernews-frontpage` | Scrape the Hacker News front page (titles, points, comment counts). |
| [health](health/) | `health` | Code quality dashboard. (gstack) |
| [investigate](investigate/) | `investigate` | Systematic debugging with root cause investigation. (gstack) |
| [ios-clean](ios-clean/) | `ios-clean` | Remove the DebugBridge SPM package and all #if DEBUG wiring from an iOS app. (gstack) |
| [ios-design-review](ios-design-review/) | `ios-design-review` | Visual design audit for iOS apps on real hardware. (gstack) |
| [ios-fix](ios-fix/) | `ios-fix` | Autonomous iOS bug fixer. (gstack) |
| [ios-qa](ios-qa/) | `ios-qa` | Live-device iOS QA for SwiftUI apps. (gstack) |
| [ios-sync](ios-sync/) | `ios-sync` | Regenerate the iOS debug bridge against the latest upstream gstack templates. (gstack) |
| [land-and-deploy](land-and-deploy/) | `land-and-deploy` | Land and deploy workflow. (gstack) |
| [landing-report](landing-report/) | `landing-report` | Read-only queue dashboard for workspace-aware ship. (gstack) |
| [learn](learn/) | `learn` | Manage project learnings. |
| [make-pdf](make-pdf/) | `make-pdf` | Turn any markdown file into a publication-quality PDF. (gstack) |
| [office-hours](office-hours/) | `office-hours` | YC Office Hours — two modes. (gstack) |
| [open-gstack-browser](open-gstack-browser/) | `open-gstack-browser` | Launch GStack Browser — AI-controlled Chromium with the sidebar extension baked in. |
| [pair-agent](pair-agent/) | `pair-agent` | Pair a remote AI agent with your browser. (gstack) |
| [plan-ceo-review](plan-ceo-review/) | `plan-ceo-review` | CEO/founder-mode plan review. (gstack) |
| [plan-design-review](plan-design-review/) | `plan-design-review` | Designer's eye plan review — interactive, like CEO and Eng review. (gstack) |
| [plan-devex-review](plan-devex-review/) | `plan-devex-review` | Interactive developer experience plan review. (gstack) |
| [plan-eng-review](plan-eng-review/) | `plan-eng-review` | Eng manager-mode plan review. (gstack) |
| [plan-tune](plan-tune/) | `plan-tune` | Self-tuning question sensitivity + developer psychographic for gstack (v1: observational). (gstack) |
| [qa](qa/) | `qa` | Fix browser/API/CLI/job/worker/webhook bugs. (gstack) |
| [qa-only](qa-only/) | `qa-only` | Report browser/API/CLI/job/worker/webhook bugs. (gstack) |
| [retro](retro/) | `retro` | Weekly engineering retrospective. (gstack) |
| [review](review/) | `review` | Pre-landing PR review. (gstack) |
| [scrape](scrape/) | `scrape` | Pull data from a web page through the Aside browser — your real, already signed-in sessions. (gstack) |
| [setup-browser-cookies](setup-browser-cookies/) | `setup-browser-cookies` | Import cookies from your real Chromium browser into the headless browse session. (gstack) |
| [setup-deploy](setup-deploy/) | `setup-deploy` | Configure deployment settings for /land-and-deploy. |
| [setup-gbrain](setup-gbrain/) | `setup-gbrain` | Set up gbrain for this coding agent: install the CLI, initialize a local PGLite or Supabase brain, register MCP, capture per-remote trust policy. (gstack) |
| [ship](ship/) | `ship` | Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR. (gstack) |
| [skillify](skillify/) | `skillify` | Codify the most recent successful /scrape flow into a permanent browser-skill on disk. (gstack) |
| [spec](spec/) | `spec` | Turn vague intent into a precise, executable spec in five phases. (gstack) |
| [sync-gbrain](sync-gbrain/) | `sync-gbrain` | Keep gbrain current with this repo's code and refresh agent search guidance in CLAUDE.md. (gstack) |
| [test-audit](test-audit/) | `test-audit` | Find low-value or duplicate tests and the test-only code they keep alive. (gstack) |
| [unfreeze](unfreeze/) | `unfreeze` | Clear the freeze boundary set by /freeze, allowing edits to all directories again. (gstack) |
