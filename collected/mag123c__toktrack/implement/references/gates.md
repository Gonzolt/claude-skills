# Gate pre-run + Acceptance→RED (implement consumes the PLAN's gates)

Tag vocabulary is defined in clarify `../../clarify/references/provenance.md`. implement *executes* those tags.

## Phase 0 gate pre-run (MUST — before coding)
Run the PLAN's `[unverified-gate: probe=<cmd>]` and Phase 0 probes **before writing code (RED)**.
- pass → record evidence, proceed.
- fail → **halt + report to user.** Do not build on a falsified assumption (kill post-plan surprises at the *start*).
- still unverifiable now (prod smoke / external permission / GUI-only) → keep the `[unverified-gate]` tag and carry it to verify/wrap.

## Acceptance → RED mapping
Map the PLAN's Acceptance / Definition of Done items to RED tests 1:1 (for the verifiable ones).
- verifiable → specify as a failing test, then GREEN.
- not verifiable (manual/prod) → mark `[unverified-gate: probe=<manual check>, owner, due]` and hand it to **verify's Acceptance reconciliation → wrap's Plan Reconciliation**.

## Carry rule
A gate implement could not close does not vanish — it travels tagged to verify; if verify can't close it, to wrap as `delegated`. (Chain: clarify creates → implement pre-runs → verify reconciles → wrap settles.)
