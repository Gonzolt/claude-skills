# kenryu42/cc-safety-net

Copied from https://github.com/kenryu42/cc-safety-net (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [cc-safety-net](cc-safety-net/) | `skills/cc-safety-net` | Operate CC Safety Net: explain why a command was blocked, triage false positives, configure custom rulebooks, manage agent CLI integrations, and diagnose protection. |
| [ccsn-find-simplifications](ccsn-find-simplifications/) | `.agents/skills/ccsn-find-simplifications` | Use when working in the cc-safety-net repo to find non-obvious simplification candidates: dead, duplicated, speculative, over-built, or contract-exceeding surfaces in the shell parser, analyzer, gu… |
| [ccsn-no-comments](ccsn-no-comments/) | `.agents/skills/ccsn-no-comments` | Use in the cc-safety-net repo when `bun run lint:comments` or `bun run check` reports a comment, a stale comment-allowlist entry, or a file it cannot parse, and before writing a code comment there.… |
| [release-notes](release-notes/) | `.claude/skills/release-notes` | Generate and publish concise, evidence-based notes in the body of the latest existing GitHub Release. Use only when the user explicitly invokes `$release-notes` or explicitly asks to update the lat… |
| [verify-ccsn](verify-ccsn/) | `.agents/skills/verify-ccsn` | Launch and drive the real cc-safety-net CLI — the hook decision path, explain, status/doctor/statusline, logs, rule and policy config, and the local policy GUI — against an isolated home, capturing… |
| [verify-project-tighten-only](verify-project-tighten-only/) | `.agents/skills/verify-project-tighten-only` | Use in the cc-safety-net repo before finishing any change to how a project policy merges with the user policy or how a merged policy turns into protections: src/core/policy/merge.ts, safety-level.t… |
