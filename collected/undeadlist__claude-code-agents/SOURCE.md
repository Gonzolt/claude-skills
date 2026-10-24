# undeadlist/claude-code-agents

Copied from https://github.com/undeadlist/claude-code-agents (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [bug-fix](bug-fix/) | `skills/bug-fix` | Fix bugs with regression prevention using test-first approach |
| [full-audit](full-audit/) | `skills/full-audit` | Run all 11 audit agents in parallel, then consolidate findings with fix-planner |
| [new-feature](new-feature/) | `skills/new-feature` | Develop new features with test-first approach (TDD) |
| [pre-commit](pre-commit/) | `skills/pre-commit` | Run code quality checks and tests before committing |
| [pre-deploy](pre-deploy/) | `skills/pre-deploy` | Validate build, environment, and dependencies before deployment |
| [release-prep](release-prep/) | `skills/release-prep` | Full audit + fixes + deploy validation for production release |
