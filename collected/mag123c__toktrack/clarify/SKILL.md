---
name: clarify
description: |
  Adaptive requirements clarification with auto-depth routing.
  Shallow (Q&A) for simple tasks, Deep (exploration + DRAFT + PLAN) for complex ones.
  Escalates automatically when ambiguity persists.
required_context:
  - .claude/ai-context/architecture.md
  - .claude/ai-context/conventions.md
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
  - Write
  - AskUserQuestion
---

# /clarify — Adaptive Requirements Clarification

## Chain (MUST)
| Previous | Current | Next |
|----------|---------|------|
| Session start | /clarify | Present PLAN inline → /implement |

## Core Model

```
/clarify → Measure complexity → Clear enough?
                                ├─ Yes → Present PLAN inline → /implement
                                └─ No  → Deeper clarify (explore, analyze, DRAFT...)
                                         → Re-measure → Repeat
```

Exit condition: **"Is this enough info to implement?"** — Critical Unknown=0 + remaining items are made visible (Provenance).

---

## Reference Files (load as needed — chaining)

| When | File |
|------|------|
| Tagging provenance on key decisions/assumptions / probe decisions | `references/provenance.md` |
| Pre-PLAN user confirmation | `references/checkpoint.md` |
| When document authority/reading order is unclear | `references/doc-roles.md` |
| Full Deep path procedure | `deep/DEEP.md` |
| PLAN/DRAFT structure (Lite/Full + Clarify Verdict) | `templates/` |

> Inline essentials only: **probe-don't-tag** (if cheaply verifiable, measure instead of tagging), **PLAN=intent · WRAP/DECISIONS=fact**, **do not hide inferences**. Details in the references above.

---

## Step 0: Route — Complexity Assessment

Measure complexity internally upon receiving request (do not expose to user).

### Complexity Signals

| Signal | LOW | HIGH |
|--------|-----|------|
| Request length | Short and specific | Long or ambiguous |
| Keywords | "add", "fix", "change" | "design", "migration", "from scratch" |
| Uncertainty | None | "not sure", "how should I" |
| Impact scope | Single file/module | Cross-cutting, multiple services |
| Risk | Low (UI, text) | High (DB, auth, breaking API) |
| Existing patterns | Clearly exist | None or unfamiliar stack |

- **LOW** → Shallow Path (completed within this file)
- **HIGH** → Deep Path (see `deep/DEEP.md`)
- **Ambiguous** → Start Shallow, monitor escalation conditions

---

## Shallow Path (Low Complexity)

Remove ambiguity via quick Q&A, generate minimal specs, and present the PLAN inline.

### Execution

1. **Record**: Log original request + identify ambiguous parts
2. **Question**: `AskUserQuestion` (specific options, 2-3 rounds)
3. **Escalation Check**: Check escalation conditions (see below)
4. **Create DRAFT**: Write `.dev/specs/{name}/DRAFT.md` (minimal version — What, Why, Scope, Success Criteria)
5. **Summary + Create PLAN**: Before/After comparison → Write `.dev/specs/{name}/PLAN.md`
6. **Present PLAN**: Present the PLAN inline in the conversation (do NOT enter plan mode), then immediately call `/implement`. The plan file must be written to `.dev/specs/{name}/PLAN.md`

### Rules
- No assumptions → Ask questions
- Clarify to TDD-ready level
- Target resolution within 3 rounds

### Escalation → Deep Path

Switch to Deep Path if any of these are detected:

- Scope still undefined after 3 rounds of questions
- New uncertainties keep emerging from user answers
- Impact scope expanded beyond initial estimate (single → multi-module)
- Risk indicators found (DB schema, auth, breaking changes)
- User doesn't know the approach itself ("I don't know how to do this")

On switch: Inform "Scope is more complex than expected. Exploring the codebase first." then follow the process in `deep/DEEP.md`.

---

## Deep Path

**When complexity is HIGH or escalated from Shallow.**

See `deep/DEEP.md` for the full process.

Summary:
1. Classify intent (7 types) → Determine strategy
2. 3 parallel exploration agents → Understand codebase
3. Generate DRAFT → Interview → Continuously update
4. On user explicit request → Analysis agents → Generate PLAN → Reviewer loop
5. Present PLAN inline → immediately call `/implement` (no plan mode entry)

---

## DECISIONS.md Recording (MUST)

Record decisions in `.dev/DECISIONS.md` before finalizing plan:

| Situation | Required Record |
|-----------|----------------|
| New feature design | Decision background, alternatives, reasoning |
| Architecture choice | Considered options, selection rationale |
| Trade-offs | What was sacrificed and what was gained |

```markdown
## YYYY-MM-DD: {feature-name}
- **Decision**: What was decided
- **Reason**: Why this choice was made
- **Alternatives**: Options considered but not chosen
- **Reference**: .dev/specs/{feature-name}/PLAN.md (if exists)
```

---

## Plan File Requirements

Plan files must include:
- Specify implementation via `/implement` skill
- Verification method (test execution)
- Confirmation that `.dev/DECISIONS.md` recording is complete

**Plan File Location**: The PLAN must be written to `.dev/specs/{name}/PLAN.md`.

**Important**: Plans that do not use `/implement` will not be approved.

---

## NEXT STEP (Auto-execute)

After presenting the PLAN inline, call `/implement` **immediately**. Do NOT enter plan mode; do not ask "Should I implement?".
