# jahro-console/unity-agent-skills

Copied from https://github.com/jahro-console/unity-agent-skills (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [jahro-commands](jahro-commands/) | `skills/jahro-commands` | Analyzes C# classes and generates [JahroCommand] attributes with correct syntax, RegisterObject patterns, and group organization. Use when the user wants to add runtime commands, cheats, or debug a… |
| [jahro-logging](jahro-logging/) | `skills/jahro-logging` | Reviews and improves Debug.Log usage in Unity C# projects following structured logging principles: context tags, severity contracts, boundary-based placement, and criticality tiers. Detects common… |
| [jahro-migration](jahro-migration/) | `skills/jahro-migration` | Analyzes existing debug systems (IMGUI menus, custom loggers, cheat frameworks, performance HUDs) and generates incremental migration plans to Jahro equivalents. Use when the user wants to replace… |
| [jahro-production](jahro-production/) | `skills/jahro-production` | Configures Jahro lifecycle controls for safe production deployment including JAHRO_DISABLE, auto-disable, and build validation. Use when the user mentions production builds, release builds, disabli… |
| [jahro-setup](jahro-setup/) | `skills/jahro-setup` | Detects Jahro in Unity projects and guides installation, API key configuration, and feature overview. Use when the user mentions Jahro setup, installation, getting started, debug console, or asks w… |
| [jahro-snapshots](jahro-snapshots/) | `skills/jahro-snapshots` | Guides snapshot mode selection, capture workflows, QA sharing, and team setup for Jahro Snapshots. Use when the user mentions snapshots, bug capture, sharing logs, streaming, recording, QA workflow… |
| [jahro-troubleshooting](jahro-troubleshooting/) | `skills/jahro-troubleshooting` | Diagnoses common Jahro issues using decision trees: commands not appearing, watcher not updating, console not opening, snapshots failing, launch button missing. Use when the user reports something… |
| [jahro-watcher](jahro-watcher/) | `skills/jahro-watcher` | Analyzes C# fields and properties and generates [JahroWatch] attributes with groups and performance-safe patterns. Use when the user wants to monitor variables at runtime, add watchers, track game… |
