# Pattern catalog (semantic layer)

Distilled from the field note **"Dynamic Workflow Design Patterns"** (zircote,
July 2026) — a GoF-style catalog of 20 orchestration patterns across four
families, plus 8 named anti-patterns. This is the **vocabulary** for how to
arrange `agent()`/`parallel()`/`pipeline()` calls; it is not itself the API —
for exact option shapes and runtime limits see `reference/api.md`. The full
GoF-style entries (Intent / Applicability / Structure / Consequences / Related
Patterns) live in `vendor/zircote-dynamic-workflow-patterns.md`; read that file
when a one-liner below isn't enough to decide.

The catalog's own framing, worth keeping in mind while picking a pattern:

> The structure is the value, not the agents. Spawning more agents does not
> produce confidence; arranging them so they check each other does.

## Family I — Structural (arrangement in space)

| # | Pattern | Use when | Watch for |
|---|---|---|---|
| 1 | **Fan-Out / Reduce / Synthesize** | Work decomposes into independent slices whose results must become one answer | The reduce leg is the quality bottleneck — keep as much of it as possible in deterministic code, not a synthesis agent guessing at completeness |
| 2 | **Streaming Pipeline** | Multi-stage processing over a list of items, no cross-item dependency | This is the default — reach for it before `parallel()` any time work has more than one stage |
| 3 | **Barrier Rendezvous** | A step genuinely needs the *complete* result set (dedup across sources, aggregate branching, ranking/comparison) | Only 3 legitimate justifications exist (see anti-pattern 1); "cleaner code" isn't one. Idle time = spread of worker durations |
| 4 | **Scout-Worker** | The work-item list isn't known in advance and must be discovered fresh each run | One `agent()` call enumerates against a schema; the scout is a single point of failure for coverage — schema it strictly |
| 5 | **Sub-Workflow Composition** | A proven orchestration should be reused as one step of a larger script | `workflow()` nests one level only; shares the parent's concurrency cap, agent counter, and budget |
| 6 | **Worktree Isolation** | Multiple agents write to the same repo concurrently | `agent(..., {isolation: 'worktree'})` converts N unsafe concurrent writers into N safe independent ones; partition each agent's write set to keep merges clean |

## Family II — Behavioral (arrangement over time)

| # | Pattern | Use when | Watch for |
|---|---|---|---|
| 7 | **Loop-Until-Dry** | Discovery work of unknown size (bugs, edge cases, flaky tests) | Stop on K consecutive empty rounds, not a fixed round count. Dedup against *everything ever seen*, including findings verification later rejected — otherwise it never converges |
| 8 | **Converge-Until-Green** | An executable oracle exists (compiler, linter, test suite) and fixes may interact | The oracle is ground truth; fixers never self-assess. Detect stall (no progress for K rounds) as well as success |
| 9 | **Budget-Scaled Depth** | The user gave a token target ("+500k") and depth should scale to it | Guard every loop on `budget.total != null` first — see the *Unbounded Loop* anti-pattern |
| 10 | **Phase-Gated Staging** | Human sign-off is required between stages | A workflow accepts no mid-run input — split into separate workflow invocations, one per stage, with the human decision happening in the conversation between them |
| 11 | **Model Routing** | Stages differ widely in required judgment | Route mechanical/enumeration/classification stages to a cheaper model; keep synthesis, adversarial judgment, and planning on the strongest one. A skeptic weaker than the finder rubber-stamps — don't downgrade verifiers below the model that produced the claim |

## Family III — Verification (manufacturing confidence)

| # | Pattern | Use when | Watch for |
|---|---|---|---|
| 12 | **Adversarial Verify** | A finding needs independent confirmation before it's trusted | Skeptics see only the claim, not the finder's reasoning; report only findings surviving majority vote; default the unsure case to `false` (a false positive costs investigation, a false negative just costs one finding) |
| 13 | **Perspective-Diverse Verify** | A finding can fail in more than one way (correctness vs. security vs. performance) | Vary the *lens*, not just the seed — N identical redundant refuters catch less than 3 verifiers each looking for something different |
| 14 | **Judge Panel** | The solution space is wide enough that one attempt risks a mediocre local optimum | Generate competing attempts from different angles, score against an explicit rubric, synthesize from the winner (optionally grafting runner-up ideas) |
| 15 | **Cross-Checked Claims** | Research or fact-heavy synthesis (external sources, historical claims, dependency versions) | Extract atomic claims precisely first — verification naturally parallelizes per claim once extraction is clean |
| 16 | **Test Gate** | Any mutation whose correctness an executable check can decide | Cheapest verification available when an oracle exists; stronger than agent self-assessment, but only covers properties the oracle can evaluate |

## Family IV — Contract (data crossing the deterministic/stochastic boundary)

| # | Pattern | Use when | Watch for |
|---|---|---|---|
| 17 | **Structured Output Contract** | Any `agent()` call whose result feeds downstream code or another agent | Mandatory, not optional, on multi-stage flows — bind with `schema`, let the tool-call layer retry on mismatch. A schema-validated stage can safely route down in model tier (see Model Routing) |
| 18 | **Seen-Set Ledger** | Loop-Until-Dry or any round-based accumulation needs a dedup key | Key granularity matters: too coarse merges distinct findings, too fine prevents convergence. A truncated normalized description + location is a good default |
| 19 | **Null-Tolerant Collection** | Any fan-out where an individual agent might die (timeout, exception, exhausted schema retries) | Treat a dead agent as data loss, not run failure — `.filter(Boolean)` downstream. Prefer many small agents over one large one; small agents preserve more progress on resume |
| 20 | **Parameterized Command** | A workflow will be saved and re-run with different inputs | Design the return value of one stage to double as the `args` contract for the next (see Phase-Gated Staging); maintaining a saved workflow's `args` shape is an API-discipline problem, not a one-off |

## Part IV — Anti-patterns

Each names a recurring mistake; the fix is always one of the twenty patterns above.

1. **Barrier Abuse** — over-synchronizing with `parallel()` between stages when a `Streaming Pipeline` would suffice. The single most common structural mistake. Smell test: `parallel → transform → parallel` where the transform has no cross-item dependency should have been one `pipeline`.
2. **The Impatient Monitor** — checking results mid-run, or resuming/inspecting before agents have actually finished. A workflow's intermediate state lives in script variables and the journal, not the conversation; use `/workflows` or the run's `runId`, don't guess.
3. **Hidden Clock** — reaching for `Date.now()`, `Math.random()`, or an argless `new Date()` inside the script. All three throw by design — they'd break the journal-replay contract that makes resume possible. Pass time/randomness in through `args` or resolve them via an `agent()` call.
4. **Context Flood** — returning raw worker output instead of reducing it first. Defeats the purpose of moving intermediate state out of the conversation; always merge/synthesize before the workflow's final `return`.
5. **Mid-Run Conversation** — trying to gate execution on human input inside a run (a file-poll, a prompt to the void). Architecturally impossible — a workflow accepts no mid-run input. Use *Phase-Gated Staging* instead: split into separate workflows with the human decision made in conversation between them.
6. **Unbounded Loop** — looping on `budget.remaining()` without checking `budget.total != null` first (`remaining()` is `Infinity` with no target, so the loop runs to the 1,000-agent cap), or a Loop-Until-Dry with no round cap at all.
7. **Free-Text Parsing** — extracting data from an agent's prose instead of binding a `schema`. Fragile, and it silently forfeits the ability to route that stage to a cheaper model. Use *Structured Output Contract* on every agent whose result feeds code or another agent.
8. **Monolithic Agent** — doing everything in one giant `agent()` call because "fewer agents is simpler." Forfeits coverage guarantees (nothing enumerates the item list in code), verification opportunities (nothing to adversarially check independently), and resume granularity (one big agent restarts entirely on interruption instead of resuming from cached sub-results).

## Decision guide (which pattern first)

1. **Is the work a list of similar items?** → *Scout-Worker* to discover it (if not already known), then *Streaming Pipeline* to process it. Only reach for *Barrier Rendezvous* if a later stage genuinely needs the whole set at once.
2. **Does a finding need to be trusted before it's reported?** → *Adversarial Verify* (or *Perspective-Diverse Verify* if it can fail more than one way). Every verifier input and output should be schema-bound (*Structured Output Contract*).
3. **Is the stopping point unknown in advance?** → *Loop-Until-Dry* (discovery) or *Converge-Until-Green* (an oracle exists) — never a bare fixed-round loop, and always guarded against *Unbounded Loop*.
4. **Does a human need to approve something mid-task?** → *Phase-Gated Staging*, never *Mid-Run Conversation*.
5. **Will this run again with different inputs?** → *Parameterized Command*, and design the `args` contract deliberately.
6. **Do multiple agents write to the same files?** → *Worktree Isolation*.
