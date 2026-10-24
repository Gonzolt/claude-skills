# SerhiiKorniienko/bullshit-detector

Copied from https://github.com/SerhiiKorniienko/bullshit-detector (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [bullshit-detector](bullshit-detector/) | `skills/analysis/bullshit-detector` | Fact-check and hype-audit content. Extracts the discrete claims from a video, article, tweet, or PDF, verifies each against independent sources via web search, and produces a report card with per-c… |
| [coverage-check](coverage-check/) | `skills/ingestion/coverage-check` | Count how many independent origins are behind news coverage of a claim, instead of counting URLs. Queries GDELT for matching articles, collapses reprints and wire copy into single origins, and flag… |
| [explain](explain/) | `skills/analysis/explain` | Explain content or any concept inside it at the depth the user needs — ELI5, practitioner level, or expert deep-dive — with a jargon glossary and context the original assumes. Use when the user say… |
| [fetch-content](fetch-content/) | `skills/ingestion/fetch-content` | Fetch and normalize any content source into clean text with metadata — YouTube video transcripts, TikTok captions, web articles, PDFs, tweets/X posts, local files. Use when the user shares a YouTub… |
| [report-card](report-card/) | `skills/publishing/report-card` | Render a finished BS report as a self-contained HTML page — score hero, filterable claims, readable on a phone, prints to a clean PDF. Use when the user wants to open, share, print, or show a repor… |
| [share](share/) | `skills/publishing/share` | Turn a BS report (or any analysis result) into ready-to-paste posts for X/Twitter, LinkedIn, Facebook, Reddit, Hacker News, or a newsletter issue — plus a branded image carousel (PNGs + PDF) for vi… |
| [summarize](summarize/) | `skills/analysis/summarize` | Produce a structured summary of a video, article, tweet thread, or PDF — TLDR, key points with timestamps/locations, notable quotes, and who should read/watch it. Use when the user asks to summariz… |
