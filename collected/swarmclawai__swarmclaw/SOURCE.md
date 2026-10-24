# swarmclawai/swarmclaw

Copied from https://github.com/swarmclawai/swarmclaw (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [coding-agent](coding-agent/) | `skills/coding-agent` | Delegate coding tasks to external coding agents (Claude Code, Codex, Pi, OpenCode) via shell. Use when: (1) building new features or apps in a separate project, (2) reviewing PRs, (3) refactoring l… |
| [github](github/) | `skills/github` | GitHub operations via `gh` CLI: issues, PRs, CI runs, code review, API queries. Use when: (1) checking PR status or CI, (2) creating/commenting on issues, (3) listing/filtering PRs or issues, (4) v… |
| [google-workspace](google-workspace/) | `skills/google-workspace` | Use Google Workspace CLI (`gws`) for Drive, Docs, Sheets, Gmail, Calendar, Chat, and related Workspace API tasks. |
| [nano-banana-pro](nano-banana-pro/) | `skills/nano-banana-pro` | Generate or edit images via Gemini 3 Pro Image (Nano Banana Pro). Use when asked to create, generate, or edit images and a Gemini API key is available. Supports text-to-image generation, single-ima… |
| [nano-pdf](nano-pdf/) | `skills/nano-pdf` | Edit or create PDFs with natural-language instructions using the nano-pdf CLI. Use when asked to make a PDF, edit a PDF, add pages, change text in a PDF, or convert content to PDF format. |
| [openai-image-gen](openai-image-gen/) | `skills/openai-image-gen` | Generate images via OpenAI Images API (GPT Image, DALL-E 3, DALL-E 2). Supports batch generation with random prompt sampler and HTML gallery output. Use when asked to generate images with OpenAI an… |
| [resourceful-problem-solving](resourceful-problem-solving/) | `skills/resourceful-problem-solving` | Always-on guidance for solving tasks resourcefully. Teaches agents to escalate through skills, CLI tools, and custom scripts instead of refusing. Applies to any request where the agent lacks a dedi… |
| [skill-creator](skill-creator/) | `skills/skill-creator` | Create, edit, improve, or audit skills for SwarmClaw agents. Use when creating a new skill from scratch or when asked to improve, review, audit, tidy up, or clean up an existing skill or SKILL.md f… |
| [skills--swarmclaw](skills--swarmclaw/) | `skills/swarmclaw` | AI agent runtime and multi-agent orchestration platform. Teaches agents how to use SwarmClaw's 6 primitive tools, persistent memory, dreaming, delegation, connectors, credentials, and the skill sys… |
| [summarize](summarize/) | `skills/summarize` | Summarize or extract text/transcripts from URLs, podcasts, YouTube videos, and local files using the summarize CLI. Use when asked to summarize a link, article, video, or file, or to transcribe a Y… |
| [swarmclaw](swarmclaw/) | `swarmclaw` | Manage your SwarmClaw agent fleet — agents, tasks, chats, chatrooms, goals, schedules, memory, wallets, connectors, autonomy, and 40+ more command groups. Use when asked to dispatch work, check age… |
| [swarmvault](swarmvault/) | `skills/swarmvault` | Use when working with a SwarmVault knowledge vault (raw/, wiki/, swarmvault.schema.md). Establishes schema-first conventions and prefers graph queries over broad search. |
