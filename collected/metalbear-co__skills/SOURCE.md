# metalbear-co/skills

Copied from https://github.com/metalbear-co/skills (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [mirrord-chaos](mirrord-chaos/) | `skills/mirrord-chaos` | Help users chaos test their app with mirrord: inject artificial latency or connection errors into a mirrord session's outgoing traffic via per-session chaos rules managed with the `mirrord chaos` C… |
| [mirrord-ci](mirrord-ci/) | `skills/mirrord-ci` | Help users set up mirrord in CI pipelines for testing against real Kubernetes environments. Use when users want to run end-to-end tests, integration tests, or automated tests in CI using mirrord to… |
| [mirrord-config](mirrord-config/) | `skills/mirrord-config` | Helps users generate, edit, and validate mirrord.json configuration files for mirrord (MetalBear). Use when the user wants to connect their local process to a Kubernetes environment, configure feat… |
| [mirrord-db-branching](mirrord-db-branching/) | `skills/mirrord-db-branching` | Helps users configure mirrord.json for database branching, enabling isolated database copies for safe development and testing. Use when the user wants to set up MySQL, MariaDB, PostgreSQL, MSSQL, M… |
| [mirrord-header-propagation](mirrord-header-propagation/) | `skills/mirrord-header-propagation` | Makes a codebase propagate W3C baggage (the `baggage` header carrying `mirrord-session=<key>`) end to end, so mirrord HTTP filters, preview environments, and queue splitting can route a whole reque… |
| [mirrord-kafka](mirrord-kafka/) | `skills/mirrord-kafka` | Helps DevOps engineers configure mirrord Operator's Kafka queue splitting feature end-to-end. Generates the MirrordSplitConfig and MirrordPropertyList Kubernetes CRD YAMLs (the current resources; M… |
| [mirrord-operator](mirrord-operator/) | `skills/mirrord-operator` | Help users install and configure the mirrord Operator for team/enterprise environments. Use when users ask about operator setup, Helm installation, cloud API key or license configuration, air-gappe… |
| [mirrord-prev-env](mirrord-prev-env/) | `skills/mirrord-prev-env` | Help users create and manage mirrord preview environments — running a modified service as an isolated pod in a shared Kubernetes cluster, scoped by an environment key and HTTP/queue traffic filteri… |
| [mirrord-propagation-discovery](mirrord-propagation-discovery/) | `skills/mirrord-propagation-discovery` | Scans a live Kubernetes environment with `mirrord dump` to find an identifier mirrord can filter traffic on: a header, a `baggage` or `tracestate` member, a tenant or user id, a trace id (W3C, B3,… |
| [mirrord-quickstart](mirrord-quickstart/) | `skills/mirrord-quickstart` | Guide users from zero to their first working mirrord session — check system requirements, install mirrord via CLI, VS Code, or IntelliJ, run a first session against a Kubernetes target, and verify… |
| [mirrord-temporal](mirrord-temporal/) | `skills/mirrord-temporal` | Helps DevOps engineers configure mirrord Operator's Temporal task queue splitting feature end-to-end. Generates the MirrordSplitConfig and MirrordPropertyList Kubernetes CRD YAMLs, the matching mir… |
| [mirrord-up](mirrord-up/) | `skills/mirrord-up` | Helps users run multiple concurrent mirrord sessions from a single mirrord-up.yaml (compose-style multi-service local debugging). Use when the user mentions mirrord up, mirrord-up.yaml, mirrord up… |
