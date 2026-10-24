# WenyuChiou/agent-collab-skills

Copied from https://github.com/WenyuChiou/agent-collab-skills (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [agent-acceptance-gate](agent-acceptance-gate/) | `skills/agent-acceptance-gate` | Use when about to commit or push a diff that touches two or more locale variants of one file stem, adds catalog or listing entries, states benchmark numbers, release dates, or licenses for named fr… |
| [agent-context-budget](agent-context-budget/) | `skills/agent-context-budget` | Use when launching parallel or background subagents, or when a handoff, log, or result would be more than a short summary (roughly 2 KB). Caps return sizes (summary in the reply, detail by path), p… |
| [agent-debate](agent-debate/) | `skills/agent-debate` | Use when a consequential decision has two plausible, materially different options and you are about to pick one. Runs two opposed reviewers on the same evidence with a stated round cap, then hands… |
| [agent-output-reconciler](agent-output-reconciler/) | `skills/agent-output-reconciler` | Use when a plan, prompt, or doc still names agent-output-reconciler. Since 0.6.0 reconciliation is step 1 of agent-acceptance-gate; this redirect stub is removed in 0.7.0. |
| [agent-plan-act-reflect](agent-plan-act-reflect/) | `skills/agent-plan-act-reflect` | Use when a plan, prompt, or doc still names agent-plan-act-reflect. Deprecated in 0.6.0; ordinary iterate-until-it-passes work needs no skill, and an unattended policy-driven loop follows agent-con… |
| [agent-shared-memory](agent-shared-memory/) | `skills/agent-shared-memory` | Use when a plan, prompt, or doc still names agent-shared-memory. Since 0.6.0 proposal-only coordination memory is the Durable decisions section of agent-context-budget; this redirect stub is remove… |
| [agent-task-splitter](agent-task-splitter/) | `skills/agent-task-splitter` | Use when about to run two or more subagents, workflow lanes, or delegated CLI executors on one goal. Gives each lane a role, a pinned model tier, a disjoint file scope, a bounded brief, and a cappe… |
