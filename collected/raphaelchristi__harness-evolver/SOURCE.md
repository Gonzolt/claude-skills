# raphaelchristi/harness-evolver

Copied from https://github.com/raphaelchristi/harness-evolver (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [certify](certify/) | `skills/certify` | Use when the user wants to verify that the evolved agent's score is stable and reliable. Runs evaluation multiple times and reports mean ± std. |
| [deploy](deploy/) | `skills/deploy` | Use when the user is done evolving and wants to finalize, clean up, tag the result, or push the optimized agent. |
| [dev-dry-run](dev-dry-run/) | `.claude/skills/dev-dry-run` | Use when the user wants to smoke-test the evolve pipeline, test tools, or verify the plugin works end-to-end. Also use when the user says 'dry run', 'smoke test', or 'test pipeline'. |
| [dev-release](dev-release/) | `.claude/skills/dev-release` | Use when the user wants to release a new version, publish to npm, create a GitHub release, bump version, or tag a release. Also use when the user says 'release', 'publish', 'bump version', 'tag', o… |
| [dev-validate](dev-validate/) | `.claude/skills/dev-validate` | Use when the user wants to validate the plugin, check integrity, verify cross-references, or before a release. Also use when the user says 'validate', 'check plugin', or 'verify'. |
| [evolve](evolve/) | `skills/evolve` | Use when the user wants to run the optimization loop, improve agent performance, evolve the agent, or iterate on quality. Requires .evolver.json to exist (run harness:setup first). |
| [health](health/) | `skills/health` | Use when the user wants to check dataset quality, diagnose eval issues, or before running evolve. Checks size, difficulty distribution, dead examples, coverage, and splits. Auto-corrects issues found. |
| [setup](setup/) | `skills/setup` | Use when the user wants to set up the evolver in their project, optimize an LLM agent, improve agent performance, or mentions evolver for the first time in a project without .evolver.json. |
| [status](status/) | `skills/status` | Use when the user asks about evolution progress, current scores, best version, how many iterations ran, or whether the loop is stagnating. |
