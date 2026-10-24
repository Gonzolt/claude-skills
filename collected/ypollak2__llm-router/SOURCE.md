# ypollak2/llm-router

Copied from https://github.com/ypollak2/llm-router (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [release](release/) | `skills/release` | Run the full llm-router release pipeline: version bump, checks, tag and publish |
| [route](route/) | `skills/route` | Route a task to the best LLM based on task type and complexity |
| [routing](routing/) | `skills/routing` | Route tasks to the cheapest capable model automatically using llm_router MCP tools |
| [savings](savings/) | `skills/savings` | Report how much routing has saved by sending tasks to cheaper models |
