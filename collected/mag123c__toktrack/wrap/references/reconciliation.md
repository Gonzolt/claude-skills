# Plan Reconciliation (close gates or explicitly delegate)

Reconcile the PLAN's provenance tags/gates one-by-one. **No silent TODOs — close or delegate, one or the other.** This plugs the leak point for "unexpected situations after implementation".

For each `[unverified-gate]` / `[agent-inferred]` / Phase 0 gate:
- **confirmed**: probe re-run passed → record evidence in WRAP
- **falsified**: assumption was wrong → what was done instead + why it changed in WRAP; if direction changed, also in DECISIONS
- **changed (pivot)**: detail in WRAP + why in DECISIONS
- **delegated** (cannot close at wrap time — requires post-merge/permissions/operator/prod smoke): use the block below
```
- Gate: <what>
- Status: delegated
- Owner: user | ops | next-agent
- Due/Trigger: after merge | after deploy | <condition>
- Probe: <command or precise manual check>
- Risk if skipped: <impact>
```

## Escalation criteria (where to record — no over-expansion)
| Target | What |
|------|--------|
| WRAP | **Detail** of what was done/verified/changed/pivoted (all of it) |
| DECISIONS | **Why** the direction changed + only lessons worth recurring |
| CLAUDE.md (gotcha) | Only things **recurring·critical** enough to elevate repo-wide |

> Do not put all verification results in DECISIONS (noise). WRAP=detail, DECISIONS=why, CLAUDE.md=critical·recurring.
> **If any PLAN gate/assumption is unreconciled, wrap is not complete** — done only after all are confirmed/falsified/changed/delegated.
