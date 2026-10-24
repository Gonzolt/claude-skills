---
name: verify
description: Self-healing verification loop (test → clippy → fmt)
required_context: []
---

# Verify

## Flow
```
cargo test → cargo clippy → cargo fmt --check
    │            │              │
    └── On fail: fix and retry (notify user after 3 same failures)
```

## Commands
```bash
cargo test --quiet
cargo clippy --all-targets --all-features -- -D warnings
cargo fmt --all -- --check
```

## Verification Honesty (MUST — PASS gate)

Verification trustworthiness lies not in "what passed" but in **"what was *actually executed* and passed"**. Enforced before any PASS verdict.

### Skip ≠ Pass
- Tests marked `ignored` / `#[ignore]` are **unverified** → do not count as green.
- Tests skipped due to environment (missing external service, platform constraints, etc.) are a **BLOCKER**. If unfixable, escalate to user as "verification incomplete + reason" rather than PASS.

### Do not cite unrun tests as verification evidence
- "Confirmed via test X" is only valid when **that test actually ran and passed in this execution**.
- Do not use a merely written test as evidence of "confirmed" (false-green = false reassurance).

### Coverage honesty (mock ≠ real)
- Mock-based unit tests verify **only the logic inside the mock boundary**. Behaviors invisible to mocks — file I/O, concurrency, simd-json real parsing — are **confirmed only by integration verification**.
- If a path is covered only by mocks, report it as **"mock coverage only — integration unconfirmed"** rather than "verified".

### Acceptance/DoD cross-check (carry PLAN gates)
- Read the PLAN Acceptance/DoD and any `[unverified-gate]` passed from implement; cross-check whether each item **actually ran and passed in this execution**.
- If unrunnable (prod smoke / external service / CI-only environment) → no green-wash. Tag as `[unverified-gate: delegated, owner/due/probe]` and **carry to wrap Plan Reconciliation** (`../wrap/references/reconciliation.md`).

### Report format
- ✅ Actually executed and passed
- ⛔ Skipped/environment-blocked + **reason** (unresolved = BLOCKER, not PASS)
- ⚠️ Mock coverage only, integration unconfirmed
- ⏳ Delegated to wrap due to unverifiable Acceptance item

## Self-Healing
- Fail → analyze error → fix code → retry
- Same error 3 times → notify user

## Rules
- Required before commit
- Order: test → clippy → fmt
- All must pass to proceed

## Next Step
**Only when the Verification Honesty gate passes** (actual execution passed, no unresolved BLOCKERs) → call `/review` immediately. Do not ask "should I review?".

If there are unresolved BLOCKERs, **do not proceed to /review** — report "verification incomplete + reason + required environment actions" to the user.
