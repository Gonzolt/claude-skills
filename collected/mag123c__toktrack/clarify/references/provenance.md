# Provenance & Probe (applied to all key decisions and assumptions)

Visualize "confirmed vs inferred" without adding extra question turns. Tag each key decision in PLAN/DRAFT:

| Tag | Meaning |
|------|------|
| `[user-confirmed]` | Decided directly by the user (scope/product/flow) |
| `[verified: <evidence>]` | Measured via read-only probe. evidence=`file:line` or command |
| `[agent-inferred]` | Unverified inference — **a smell. Drive the count toward 0** |
| `[unverified-gate: probe=<cmd>, owner=<who>, due=<when>]` | Cannot verify now → defer to Phase 0/post-deploy |
| `[external-prereq: <what>]` | Pre-condition outside the codebase (permissions, operators, infrastructure) |

## probe-don't-tag Principle
One `[agent-inferred]` = a deferred bomb. Before tagging, **if it can be cheaply verified, verify it and replace with `[verified]`.**

**Probe budget — if 2 or more of the following 3 apply, probe; otherwise leaving it as an assumption is fine:**
- **Cheap**: done with `rg`/file read/type·test target/JSON validate/SQL count
- **load-bearing**: if wrong, it changes the implementation direction, deployment, or data preservation
- **Repeated decision point**: the "repo killers" listed below

Leave only things that cannot be verified now (prod data, external permissions, prod smoke) as `[unverified-gate]`, and **embed the probe command in PLAN Phase 0.** The tag is not fact — **the probe is fact.** That is why the tag carries the probe with it.

## Side Effects Checked (repo killers — required in PLAN Verdict)
Generic checklists become empty theater. Use these repo-specific fixed items:
`make check (fmt+clippy+test) / CI 3 OS cross-platform compatibility / release-please semver rules (feat→minor·fix→patch·BREAKING→major) / simd-json parser changes: boundary conditions·per-platform SIMD support / ratatui TUI changes: render cycle·terminal compatibility`
