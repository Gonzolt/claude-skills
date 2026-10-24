---
name: wrap
description: Session end - document updates, commit
required_context:
  - .claude/ai-context/architecture.md
---

# Wrap

## Flow
```
Git Status → Doc Check → User Selection → Execute → Complete
```

## Execution

1. **Git Status**
   ```bash
   git status --short
   git diff --stat HEAD~3
   ```

2. **Doc Check Checklist (MUST)**
   | Change | Target | Required |
   |--------|--------|----------|
   | trait/type | architecture.md | on structural change |
   | convention | conventions.md | on new pattern |
   | **Decisions** | **.dev/DECISIONS.md** | **on new feature/design** |

   **DECISIONS.md entries (required check)**:
   - [ ] New feature implemented → record decision rationale, alternatives, reasons
   - [ ] Divergence between PLAN and actual implementation → add `**Implementation Note**`
   - [ ] New pattern/convention → also update conventions.md

3. **Plan Reconciliation (MUST)**

   Reconcile the PLAN's provenance tags/gates (`[unverified-gate]`/`[agent-inferred]`/Phase 0) one-by-one — **close (confirmed/falsified/changed) or explicitly delegate (delegated). No silent TODOs.** Unsettled gates = wrap incomplete.

   Detailed procedure·delegated block·escalation criteria (WRAP=detail/DECISIONS=why/CLAUDE.md=critical·recurring) → `references/reconciliation.md`

4. **User Selection**: AskUserQuestion
5. **Execute**: Run selected items

## DSL Rules (ai-context)
- Table > prose
- Codeblock > description
- Core only, minimize lines

## Commit
```
{type}({scope}): {summary}
```

## Completion
wrap complete = **skill chain finished**
Next task starts with new `/clarify` or `/next`
