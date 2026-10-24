# iurykrieger/claude-bedrock

Copied from https://github.com/iurykrieger/claude-bedrock (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [ask](ask/) | `skills/ask` | Adaptive vault reader skill. Receives a natural language question, uses graph.json as the primary index (Phase 2.0) before any glob/grep, then self-assesses whether more context is needed. Escalate… |
| [compress](compress/) | `skills/compress` | Vault alignment engine. Detects and fixes 5 types of structural misalignments: broken backlinks, concept fragmentation, entity miscategorization, duplicated entities, and misnamed entities. Delegat… |
| [confluence-to-markdown](confluence-to-markdown/) | `skills/confluence-to-markdown` | Internal fetcher module for Confluence pages. Fetches content via Atlassian MCP (preferred), REST API with Basic Auth (fallback), or browser DOM extraction via Claude in Chrome (last resort) and re… |
| [gdoc-to-markdown](gdoc-to-markdown/) | `skills/gdoc-to-markdown` | Internal fetcher module for Google Docs and Sheets. Fetches content via MCP (preferred, when available), Google API with bearer token or public URL export (fallback), or browser DOM extraction via… |
| [healthcheck](healthcheck/) | `skills/healthcheck` | Read-only vault health diagnostic. Generates a report without modifying any files. Checks: graphify-out integrity, setup verification, orphan entities, dangling content, old content (>15 days). Saf… |
| [learn](learn/) | `skills/learn` | Ingests an external data source into the Second Brain. Fetches content from Confluence, Google Docs, GitHub repositories, remote URLs, or any local file format supported by docling (DOCX, PPTX, XLS… |
| [preserve](preserve/) | `skills/preserve` | Single write point for the vault. Centralizes entity detection, textual matching, entity creation/update, and bidirectional linking. Accepts structured input (list of entities), free-form input (te… |
| [setup](setup/) | `skills/setup` | Initialize any folder as a Bedrock-powered Obsidian vault. Creates entity directories, copies templates, configures language and domain taxonomy, scaffolds connected example entities, and checks de… |
| [sync](sync/) | `skills/sync` | Re-synchronizes the vault with external sources. In default mode, scans the `sources` field of all entities, deduplicates URLs, fetches updated content from each source (Confluence, GDocs, GitHub,… |
| [vaults](vaults/) | `skills/vaults` | Manage registered Bedrock vaults. List all vaults, set a default vault, or remove a vault from the registry. The registry lives in the plugin directory and maps vault names to filesystem paths. Use… |
