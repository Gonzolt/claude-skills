# API and runtime reference (authoritative layer)

This file distills **Anthropic's own** dynamic-workflows documentation and the
`Workflow` tool's own description — the mechanics, limits, and behavior that
are true regardless of which orchestration pattern you're using. When this
disagrees with anything in `reference/patterns.md`, this file wins: the
pattern catalog is a semantic framework for arranging calls, not a spec for
what the calls do.

Full vendored source: `vendor/anthropic-dynamic-workflows.md` (product docs)
and `vendor/anthropic-workflow-tool-spec.md` (verbatim tool spec, including
the canonical code examples). Refresh both with `npm run hydrate-vendor`
(the tool-spec file is manual-only — see its header).

## When a workflow is the right call

Only write one when the user has actually opted in: they used the word
`ultracode`, asked in their own words for "a workflow" / "multi-agent
orchestration", invoked a skill/command that says to, or named a saved
workflow. A task that would merely *benefit* from parallelism doesn't qualify
on its own — describe the option and ask, rather than assuming.

Reach for a workflow when the task needs more agents than one conversation
turn can coordinate, or when the orchestration itself is worth having as a
rerunnable script: a codebase-wide sweep, a large migration, a research
question needing cross-checked sources, or a plan worth drafting from several
independent angles before committing.

## Hard constraints (not stylistic advice — the runtime enforces these)

| Constraint | Detail |
|---|---|
| Determinism | `Date.now()`, `Math.random()`, and argless `new Date()` throw. Pass time/randomness in via `args`, or resolve them through an `agent()` call. This is what makes resume-via-journal-replay possible. |
| Concurrency | `min(16, cpu cores - 2)` concurrent agents per workflow; excess calls queue automatically. |
| Total agents | 1,000 hard cap per run — a runaway-loop backstop, not a target to approach. |
| Batch size | A single `parallel()`/`pipeline()` call accepts at most 4096 items. |
| No mid-run input | Only agent permission prompts can pause a run. There is no way to gate on human input inside a script — split into separate workflows instead (Phase-Gated Staging in the pattern catalog). |
| No direct filesystem/shell access | The script coordinates; agents read/write/run commands. |
| Language | Plain JavaScript, not TypeScript — type annotations, interfaces, and generics fail to parse. Top-level `await` works. |
| Script shape | Must start with a pure-literal `export const meta = { name, description, phases? }` — no variables, calls, spreads, or interpolation inside it. |

## The seven core constructs

- **`agent(prompt, opts?)`** → `Promise<any>`. Spawns one subagent. `opts`: `label`, `phase`, `schema` (JSON Schema — binds structured output with automatic retry on mismatch), `model` (override; default to omitting — it inherits the session model, which is almost always right), `effort` (`'low'|'medium'|'high'|'xhigh'|'max'`, default inherit), `isolation: 'worktree'` (fresh git worktree per agent — expensive, use only when concurrent writers would otherwise collide), `agentType` (custom subagent type). Returns `null` on death (timeout, unrecoverable error, exhausted schema retries, or user skip) — `.filter(Boolean)` downstream.
- **`parallel(thunks)`** → `Promise<any[]>`. Runs concurrently; a **barrier** — awaits every thunk before returning. A throwing thunk resolves to `null`, never rejects the whole call.
- **`pipeline(items, ...stages)`** → `Promise<any[]>`. Each item runs all stages independently with **no barrier between stages** — item A can be in stage 3 while item B is still in stage 1. This is the default for any multi-stage work. Every stage receives `(prevResult, originalItem, index)`. A throwing stage drops that item to `null` and skips its remaining stages.
- **`workflow(nameOrRef, args?)`** → `Promise<any>`. Runs a saved/bundled workflow inline; shares the parent's concurrency cap, agent counter, and token budget. **One nesting level only** — `workflow()` inside a child throws.
- **`phase(title)`** / **`log(message)`** — group agents under a progress-view heading / emit a narrator line. Use `opts.phase` per-call instead of the global `phase()` inside `parallel()`/`pipeline()` stages, to avoid races on shared state.
- **`args`** — whatever was passed to the workflow invocation, verbatim (`undefined` if none). Design a saved workflow's `args` shape deliberately (Parameterized Command in the pattern catalog).
- **`budget`** — `{ total: number|null, spent(), remaining() }`. `total` is `null` unless the user gave a token target; `remaining()` is then `Infinity`. **Always guard a budget-driven loop on `budget.total != null` first** — this is the entry point for the Unbounded Loop anti-pattern.

## `pipeline()` vs `parallel()` — the one decision that matters most

Default to `pipeline()`. Reach for `parallel()` (a barrier) only when a
downstream step needs the **complete** result set from the step before it:
deduplication across all sources, an early-exit on a zero-count aggregate, or
a stage whose prompt explicitly compares findings against each other. "I need
to flatten/filter first" and "the stages feel conceptually separate" are not
valid reasons — those transforms belong inside a pipeline stage. A `parallel
→ transform → parallel` shape where the transform has no cross-item
dependency should almost always have been one `pipeline` call; see the
*Barrier Abuse* anti-pattern.

## Approval, cost, and resume (product-level behavior)

- The first run of a new workflow shows the planned phases and asks for
  approval (unless the user already opted in via `ultracode` or bypass-mode).
  Subagents always run in `acceptEdits` regardless of the parent session's
  permission mode — file edits are auto-approved, but shell/web/MCP calls
  outside the allowlist can still prompt mid-run.
- Workflows can consume substantially more tokens than a normal turn. Start
  scoped (one directory, one narrow question) before running the full-size
  version, and use `log()` liberally — intermediate state never reaches the
  conversation, so the progress view is the only debugging surface during a
  background run.
- A stopped run can resume: completed `agent()` calls replay from the
  journal's cached results; an agent that was still running when stopped is
  not saved and restarts. This is a reason to prefer many small agents over
  one large one — fine-grained fan-out preserves more progress across an
  interruption (Null-Tolerant Collection in the pattern catalog).
- A workflow that's proven useful can be saved as a `/name` command under
  `.claude/workflows/` (project, shared) or `~/.claude/workflows/` (personal)
  and re-run with different `args`.
