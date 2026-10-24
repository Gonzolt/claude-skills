# talkstream/ru-text

Copied from https://github.com/talkstream/ru-text (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [corpus](corpus/) | `tools/testdata/corpus` | Держится в снимке: это триггер активации, и его тихая правка — ровно тот класс потери, который снимок обязан показывать. |
| [ru-check](ru-check/) | `skills/ru-check` | Full Russian text quality check against the whole corpus. Triggers: вычитай, вычитай через ru-text, прогони ru-text, проверь текст по ru-text, ru-check, полная вычитка. Use when the user asks to pr… |
| [ru-score](ru-score/) | `skills/ru-score` | Score Russian text 0.0–10.0 across five dimensions: typography, clean language, grammar, structure, precision for the reader. Triggers: оцени текст, ru-score, оценка качества текста, насколько хоро… |
| [ru-text](ru-text/) | `skills/ru-text` | Russian text quality. Triggers: вычитай, проверь текст, поправь, отредактируй, причеши, ru-text. Typography silently on any Russian output; deeper editing on request. Info-style, editorial, UX writ… |
