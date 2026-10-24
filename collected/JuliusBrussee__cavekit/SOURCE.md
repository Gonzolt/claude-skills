# JuliusBrussee/cavekit

Copied from https://github.com/JuliusBrussee/cavekit (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [backprop](backprop/) | `skills/backprop` | Bug → spec protocol. When a bug is found or a test fails, trace the cause, decide whether a new §V invariant would catch recurrence, append to §B. This is the one non-obvious thing SDD does that pl… |
| [build](build/) | `skills/build` | Plan-then-execute implementation against SPEC.md. Native single-thread loop, no sub-agents. On test or build failure, auto-invokes the backprop skill before retrying — a failed verification always… |
| [caveman](caveman/) | `skills/caveman` | Caveman encoding for SPEC.md and spec-adjacent writes. Loaded by /spec, /build, /check. Cuts tokens ~75% vs prose while staying precise. Triggers on any write to SPEC.md or when user says "caveman"… |
| [check](check/) | `skills/check` | Read-only drift detector. Diffs SPEC.md against current code and reports violations grouped by severity. Writes nothing — suggests remedies via the spec or build skills but never invokes them. Trig… |
| [deepen](deepen/) | `skills/deepen` | Optional design-improvement pass for when you have spare usage to drain. Finds the shallowest modules in the code the spec touches, researches a deeper design, and proposes refactors that shrink in… |
| [grill](grill/) | `skills/grill` | Calibrated interrogation of a fuzzy idea before it becomes a spec. Asks one question at a time, recommends an answer, and lands each answer in §G (goal) or §C (constraints) — unknowns parked as `?`… |
| [research](research/) | `skills/research` | Gather external knowledge the spec needs and distill it into §R — the durable research log — so build grounds in facts instead of hallucinating library behavior. Each finding cites a source; unsour… |
| [review](review/) | `skills/review` | Adversarial senior review of the spec before any code is written. Constructs a skeptical reviewer whose authority comes from the codebase, §R research, and live best-practice — then tries to REFUTE… |
| [spec](spec/) | `skills/spec` | Create, amend, or backprop bugs into SPEC.md at repo root. Sole mutator of the project spec. Triggers when the user asks to write a spec, start a new spec, distill a spec from existing code, add in… |
