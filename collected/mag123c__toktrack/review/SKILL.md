---
name: review
description: |
  Multi-agent code review for Rust CLI/TUI.
  UX Review inactive (terminal UI — no web frontend). Code Review only.
  Includes Rust/clippy-specific checklist.
required_context:
  - .claude/ai-context/architecture.md
  - .claude/ai-context/conventions.md
---

# Review (toktrack override)

Follows the global `/review` multi-agent pattern, with the following overrides:

## Override: UX Review Inactive

This project is a terminal TUI app — **do not run the UX Review Agent.**
Run Code Review Agent only.

## Override: Code Review Checklist Extension

In addition to the global checklist, append the following to the Code Review Agent prompt:

### Critical (PLAN gate)

| Category | Items |
|----------|-------|
| PLAN assumption refutation | Does the diff **falsify** the `[agent-inferred]`/`[unverified-gate]` assumptions from the PLAN (falsified → P1+, carry to wrap) |

### Author Review Gate (P0 — Identity / Matrix)

This repo is OSS and the reviewer is the author (receiving PRs). Generic code health is covered by Rust/TUI/clippy below; this section examines product-specific risks that **only the author can validate**. Perspective SSOT: session memory `feedback_review_perspective.md`.

| Tier | Category | Items |
|------|----------|-------|
| **reject** | Identity ① ultra-fast | Adding latency·blocking IO·synchronous network to hot path/startup → reject |
| **reject** | Identity ② persistent cache / data preservation | Risk of cache·history loss or corruption → reject. backward-compat·graceful degradation are the means to uphold this |
| **ruthless** | Irreversible | breaking change · data migration · public behavior change |
| **ruthless** | Environment/state matrix (contributors test only their own machine) | OS(paths·home·file locks·Windows) / source schema version(forward new-schema+backward old-format, new source·parser PRs require old-version·unknown-schema fixture) / data shape(empty·large·corrupt·partial·permissions) / locale·TZ·DST / concurrency(read race while source file is being written) / terminal(width·color·TERM) / first-run vs upgrade migration |
| **bias to YES** | Other features·ideas | Stars are the goal — acceptance bias. But if it taxes either core(weighing down hot path·startup·cache paths), request location·approach adjustment only. additive/opt-in/lazy/behind a flag = welcome |
| **lenient** | Style·naming preferences | Linter takes precedence, bikeshed prohibited (uniform strictness = contributor friction → star loss) |
| **signal** | Direction/growth fit (not a gate) | Beyond code quality·conventions, every contribution(issue·PR) also gets a direction-fit verdict in the review output: `strengthens wedge (persistent cache/data preservation)` / `neutral (additive)` / `dilutes focus (e.g. feature-parity chasing)` + 1–2 lines of rationale. Weigh holistically: maintenance cost vs value, real value to target users(AI CLI heavy users), contribution to project direction. Never a reject reason — the two identities above remain the only gates, bias-to-YES stands |

### Rust-specific

| Category | Items |
|----------|-------|
| Safety | Minimize `unsafe` usage, comment with justification |
| Ownership | Unnecessary `.clone()`, `to_string()`, `to_owned()` |
| Error | `anyhow`/`thiserror` pattern consistency, no `unwrap()` (tests excluded) |
| Performance | Unnecessary allocation, `Vec` vs iterator chain, `Box<dyn>` vs generic |
| SIMD | Check fallback branch in simd-json parsing path |
| Concurrency | Check shared mutable state in rayon parallel path |

### TUI-specific

| Category | Items |
|----------|-------|
| Widget | ratatui `Widget` trait implementation consistency |
| Theme | Use `theme.rs` semantic colors (no hardcoded colors) |
| Layout | Handle terminal resize (`Rect` boundary check) |
| Input | Missing keyboard event handling (shortcuts registered in help vs actual handlers) |

### Clippy/Fmt Pre-check

Code Review Agent checks the following before review:

```bash
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
```

If there are clippy warnings, FAIL before starting review (should have been caught by verify).

## Execution

1. Collect context (diff, conventions, architecture, Sprint Contract)
   - PLAN provenance tags/gates (if present) — `[agent-inferred]` / `[unverified-gate]`
2. Launch **Code Review Agent only** (feature-dev:code-reviewer)
   - Global `agents/code-review.md` prompt + above author gates + Rust/TUI checklist append
3. Parse verdict → PASS → /wrap, FAIL → fix → /verify → re-review

## Rules
- **Sub-agent model**: launch the Code Review Agent via the Agent tool with `model: "sonnet"` (Sonnet 5).
- Do not run UX Review Agent (TUI project)
- PASS → run /wrap immediately
- FAIL → fix → /verify → re-review (max 3)
