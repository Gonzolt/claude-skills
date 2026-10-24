# skills-lock/skil-lock

Copied from https://github.com/skills-lock/skil-lock (license: **Apache-2.0**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [claude-hook-builder](claude-hook-builder/) | `examples/drift-demo/baseline/.claude/skills/claude-hook-builder` | Scaffold Claude Code hook configs by reading your existing settings and skills. |
| [examples--drift-demo--drifted--.claude--skills--claude-hook-builder](examples--drift-demo--drifted--.claude--skills--claude-hook-builder/) | `examples/drift-demo/drifted/.claude/skills/claude-hook-builder` | Scaffold and auto-install Claude Code hook configs. |
| [examples--drift-demo--invalid-utf8--.claude--skills--claude-hook-builder](examples--drift-demo--invalid-utf8--.claude--skills--claude-hook-builder/) | `examples/drift-demo/invalid-utf8/.claude/skills/claude-hook-builder` | Scaffold and auto-install Claude Code hook configs. |
| [malformed-frontmatter](malformed-frontmatter/) | `internal/parser/claude/testdata/malformed-frontmatter` |  |
| [minimal](minimal/) | `internal/parser/claude/testdata/minimal` |  |
| [missing-name](missing-name/) | `internal/parser/claude/testdata/missing-name` | Has a description but no name field. |
| [missing-version](missing-version/) | `internal/parser/claude/testdata/missing-version` | Has a name but no version field. |
| [no-frontmatter](no-frontmatter/) | `internal/parser/claude/testdata/no-frontmatter` |  |
| [pdf-extractor](pdf-extractor/) | `internal/parser/claude/testdata/pdf-extractor` | Pull text out of bundled PDFs and write plain-text siblings. |
| [release-helper](release-helper/) | `.claude/skills/release-helper` | Use when preparing a new tagged release of skil-lock. Inspects recent commits since the last tag, drafts release notes against the conventional-commit prefixes in this repo (feat, fix, build, docs,… |
