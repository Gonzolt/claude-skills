# egorfedorov/claude-context-optimizer

Copied from https://github.com/egorfedorov/claude-context-optimizer (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [cco](cco/) | `skills/cco` | In Claude Code: what this session costs and where the tokens go, plus the tools to cut it — /cco for the board, /cco audit, /cco task, /cco pack and more. Use when the user asks about session cost,… |
| [doc-digest](doc-digest/) | `skills/doc-digest` | Turn a long document, PDF, transcript, spreadsheet or log into a compact working digest the conversation can continue from. Use when the user shares or pastes something long (several pages or more)… |
| [fresh-start](fresh-start/) | `skills/fresh-start` | Continue in a new chat without losing anything — writes a compact handoff to paste into a fresh conversation. Use whenever the user wants to move to a new chat or conversation, hits usage limits, s… |
| [project-context](project-context/) | `skills/project-context` | Turn background the user keeps re-explaining or re-pasting into reusable instructions, so new chats start with it for free. Use when the user repeats the same context, rules, style guide, persona o… |
| [sharpen-prompt](sharpen-prompt/) | `skills/sharpen-prompt` | Rewrite a vague request into a precise prompt — goal, context, scope, constraints, what done looks like, output format. Use when the user asks to improve, rewrite, sharpen or check a prompt. |
| [token-check](token-check/) | `skills/token-check` | Estimate how many tokens a pasted text, an attached file or the conversation so far takes, what it means for the context window and usage limits, and how to cut it. Use when the user asks how big s… |
