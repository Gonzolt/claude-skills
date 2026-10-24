# daxaur/openpaw

Copied from https://github.com/daxaur/openpaw (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [c-ai](c-ai/) | `skills/c-ai` | Query LLMs from the CLI — pipe text for summarization, chat interactively, use local or cloud models with llm or aichat. |
| [c-apps](c-apps/) | `skills/c-apps` | Install, update, and search Mac App Store apps from the command line using mas. |
| [c-bluetooth](c-bluetooth/) | `skills/c-bluetooth` | Manage Bluetooth devices on macOS using the blucli (`blu`) CLI. List paired and available devices, connect to headphones/speakers/keyboards, and disconnect devices by name or MAC address. |
| [c-briefing](c-briefing/) | `skills/c-briefing` | Daily briefing — morning summary of email, calendar, tasks, weather. Can run on a schedule via launchd/cron. |
| [c-browser](c-browser/) | `skills/c-browser` | Headless browser automation — navigate pages, click elements, fill forms, take screenshots, scrape content using agent-browser or playwright-cli. |
| [c-calendar](c-calendar/) | `skills/c-calendar` | View and create calendar events via gog (Google Calendar) or icalBuddy (Apple Calendar). Check availability, list upcoming events, create/update/delete events, and manage multiple calendars. |
| [c-clipboard](c-clipboard/) | `skills/c-clipboard` | System clipboard — copy, paste, transform content between clipboard and files. |
| [c-contacts](c-contacts/) | `skills/c-contacts` | macOS Contacts — search, list, and look up contact details via AppleScript. |
| [c-core](c-core/) | `skills/c-core` | OpenPaw coordinator — routes requests to skills, manages memory, knows what's installed. Use /c for any task. |
| [c-cron](c-cron/) | `skills/c-cron` | Manage cron jobs and macOS launchctl services — schedule recurring tasks, start/stop services using lunchy-go. |
| [c-display](c-display/) | `skills/c-display` | Control display brightness and safely move files to trash instead of permanently deleting with rm. |
| [c-email](c-email/) | `skills/c-email` | Read, send, search, and label email via gog (Gmail CLI) or himalaya (IMAP). Supports inbox management, drafting replies, thread viewing, and label/folder operations across Gmail and standard IMAP a… |
| [c-files](c-files/) | `skills/c-files` | Sync files to Google Drive, S3, Dropbox, OneDrive, and 70+ cloud providers using rclone. |
| [c-github](c-github/) | `skills/c-github` | Interact with GitHub using the `gh` CLI and `jq`. Manage PRs, issues, repositories, and Actions workflows. Make raw API calls with `gh api` for anything not covered by built-in commands. |
| [c-jira](c-jira/) | `skills/c-jira` | Manage Jira issues using `jira` (jira-cli). List and filter issues, create new tickets, transition issue status, manage sprints, and add comments — all from the terminal without opening a browser. |
| [c-lights](c-lights/) | `skills/c-lights` | Control Philips Hue smart lights using the `openhue` CLI. Turn lights on/off, adjust brightness and color, activate scenes, and manage rooms and groups. |
| [c-linear](c-linear/) | `skills/c-linear` | Manage Linear issues and projects using the `linear` CLI. List and filter issues, create new issues, update status, start work on a branch, and create linked pull requests directly from the terminal. |
| [c-location](c-location/) | `skills/c-location` | Search Apple Maps, find nearby places, and get directions using the `goplaces` CLI. Supports keyword searches, category filters (restaurants, coffee, gas), and turn-by-turn directions by driving, w… |
| [c-lockin](c-lockin/) | `skills/c-lockin` | Lock In Mode — orchestrate distraction blocking, environment setup, and session tracking. |
| [c-memory](c-memory/) | `skills/c-memory` | Persistent memory across Claude Code sessions — remember facts, preferences, and context |
| [c-messaging](c-messaging/) | `skills/c-messaging` | Send and read messages via imsg (iMessage) and wacli (WhatsApp). Supports sending to individuals or groups, reading recent conversations, and checking unread messages across both platforms. |
| [c-music](c-music/) | `skills/c-music` | Control Spotify playback using the `spogo` CLI. Play, pause, skip, search tracks/albums/playlists, manage the queue, and browse your library. |
| [c-network](c-network/) | `skills/c-network` | DNS lookups with doggo and readable HTTP requests with httpie — modern networking tools for the terminal. |
| [c-notes](c-notes/) | `skills/c-notes` | Manage Apple Notes and Apple Reminders from the CLI. Uses memo for Notes and remindctl for Reminders. Supports listing, searching, reading, creating notes, and adding/completing reminders. |
| [c-notify](c-notify/) | `skills/c-notify` | Send native macOS notification center alerts from the command line using terminal-notifier. |
| [c-notion](c-notion/) | `skills/c-notion` | Manage Notion pages and databases from the CLI using notion-cli. Create, read, search, and update pages. Query databases, add entries, and manage blocks and properties. |
| [c-obsidian](c-obsidian/) | `skills/c-obsidian` | Obsidian vault as persistent memory — daily notes, session logs, knowledge capture, and search across your entire vault. |
| [c-research](c-research/) | `skills/c-research` | Summarize web URLs, PDFs, YouTube videos, and podcasts using the `summarize` CLI. Instantly extract key points from any content type without manual reading. Useful for research, link digests, and m… |
| [c-schedule](c-schedule/) | `skills/c-schedule` | Smart scheduling — automate recurring Claude tasks with cost control. Deliver results to Telegram, file, or notification. Built into OpenPaw. |
| [c-screen](c-screen/) | `skills/c-screen` | Capture screenshots and extract text via OCR using `peekaboo`, and capture webcam images using `camsnap`. Enables visual analysis of screen content and camera input. |
| [c-secrets](c-secrets/) | `skills/c-secrets` | Look up and manage secrets using 1Password CLI (`op`) or Bitwarden CLI (`bw`). Retrieve passwords, generate new passwords, and copy credentials to clipboard. CRITICAL: Never display passwords in pl… |
| [c-slack](c-slack/) | `skills/c-slack` | Send messages and upload files to Slack channels using the `slack` CLI. Supports direct messages, channel posts, file uploads, and thread replies. |
| [c-speakers](c-speakers/) | `skills/c-speakers` | Control Sonos speakers using the `sonos` CLI (sonoscli). Play, pause, adjust volume, manage groups, and play favorites across rooms and speaker zones. |
| [c-system](c-system/) | `skills/c-system` | macOS Swiss Army Knife — control volume, wifi, battery, dock, display, trash, firewall, screensaver, shutdown, and more via m-cli. |
| [c-tasks](c-tasks/) | `skills/c-tasks` | Manage tasks across Todoist (todoist-cli), Things 3 (things-cli), and Taskwarrior (task). Detects which tool is installed. Supports adding, listing, completing, and filtering tasks across all three… |
| [c-telegram](c-telegram/) | `skills/c-telegram` | Bidirectional Telegram bridge — talk to Claude from your phone. Built into OpenPaw. |
| [c-timer](c-timer/) | `skills/c-timer` | Timers, alarms, and pomodoro — set countdowns with native notifications. |
| [c-tracking](c-tracking/) | `skills/c-tracking` | Track packages across UPS, FedEx, USPS, and DHL using the `ordercli` CLI. Look up tracking numbers, get current status, estimated delivery dates, and shipment history without visiting carrier websi… |
| [c-video](c-video/) | `skills/c-video` | Download videos, extract audio, convert formats, and clip segments using `yt-dlp` and `ffmpeg`. Supports YouTube, Vimeo, and hundreds of other sites. |
| [c-video-edit](c-video-edit/) | `skills/c-video-edit` | Programmatic video creation using Remotion (React-based) and Editly (JSON-based declarative). Create, render, and compose videos from code. |
| [c-voice](c-voice/) | `skills/c-voice` | Convert speech to text using `sag` (ElevenLabs STT) and synthesize speech using `say` (macOS built-in TTS). Enables voice input transcription and audio output. |
| [c-weather](c-weather/) | `skills/c-weather` | Weather forecasts and conditions — current, hourly, multi-day. No API key needed. |
