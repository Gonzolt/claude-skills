# Agents, skills, and collaboration

[Documentation](./README-en.md) · [中文](./agents.md)

The [plugin registry](../plugin.jsonc) contains 14 agents, 6 skills, and 9 commands.
The tables use the registered IDs and link to their definitions.

## Agents

| Registered ID | Role |
|---|---|
| [`archimedes`](../src/agents/archimedes.md) | Orchestrates the workflow and carries project context |
| [`patent-innovation-architect`](../src/agents/patent-innovation-architect.md) | Generates candidate concepts with TRIZ methods |
| [`patent-landscape-analyst`](../src/agents/patent-landscape-analyst.md) | Aggregates prior-art evidence and technology landscapes |
| [`patentability-evaluator`](../src/agents/patentability-evaluator.md) | Assesses novelty, inventiveness, and utility |
| [`patent-brainstorm-moderator`](../src/agents/patent-brainstorm-moderator.md) | Moderates debate, consolidates scores, and records decisions |
| [`patent-path-recorder`](../src/agents/patent-path-recorder.md) | Persists rounds, innovation snapshots, and decision paths |
| [`patent-security-engineer`](../src/agents/patent-security-engineer.md) | Examines security weaknesses and side-channel risks |
| [`patent-product-compliance-analyst`](../src/agents/patent-product-compliance-analyst.md) | Assesses regulatory and privacy concerns |
| [`patent-disclosure-writer`](../src/agents/patent-disclosure-writer.md) | Writes and updates the disclosure in MAIN.md |
| [`patent-technical-responder`](../src/agents/patent-technical-responder.md) | Answers review issues and proposes technical revisions |
| [`patent-disclosure-reviewer`](../src/agents/patent-disclosure-reviewer.md) | Reviews drafting quality and legal consistency |
| [`patent-adversarial-examiner`](../src/agents/patent-adversarial-examiner.md) | Challenges the proposal from an examiner's perspective |
| [`patent-diagram-generator`](../src/agents/patent-diagram-generator.md) | Prepares Mermaid/PlantUML figures and coordinates rendering |
| [`patent-init-sentinel`](../src/agents/patent-init-sentinel.md) | Checks runtime, tools, MCP configuration, and project readiness |

## Skills

| Skill ID | Purpose |
|---|---|
| [`prior-art-search`](../src/skills/prior-art-search/SKILL.md) | Prior-art search procedure |
| [`evidence-card`](../src/skills/evidence-card/SKILL.md) | Structured evidence records |
| [`jurisdiction`](../src/skills/jurisdiction/SKILL.md) | Jurisdiction-specific guidance |
| [`disclosure-template`](../src/skills/disclosure-template/SKILL.md) | Disclosure structure |
| [`quality-gate`](../src/skills/quality-gate/SKILL.md) | Completion checks |
| [`brainstorm-path`](../src/skills/brainstorm-path/SKILL.md) | Decision-path recording and recovery |

Jurisdiction configuration supports `CN`, `US`, and `PCT`, with `CN` as the default.

## Commands

These are host command entry points. For terminal operations, use the
[CLI reference](./usage-en.md).

| Command | Purpose |
|---|---|
| [`/archimedes`](../src/commands/archimedes.md) | Start orchestration |
| [`/patent-new`](../src/commands/patent-new.md) | Create a patent project |
| [`/patent-search`](../src/commands/patent-search.md) | Run prior-art research |
| [`/patent-draft`](../src/commands/patent-draft.md) | Draft a disclosure |
| [`/patent-review`](../src/commands/patent-review.md) | Review a disclosure |
| [`/patent-status`](../src/commands/patent-status.md) | Inspect project status |
| [`/brainstorm-resume`](../src/commands/brainstorm-resume.md) | Inspect or resume decision paths and ideas |
| [`/patent-diagram`](../src/commands/patent-diagram.md) | Generate, re-render, or inspect figures |
| [`/patent-check`](../src/commands/patent-check.md) | Check environment readiness |

## Five collaboration patterns

### 1. Orchestration

Archimedes receives the topic, assembles project context, and coordinates specialist
tasks. The initialization sentinel checks readiness before research.
The host supplies actual invocation capabilities; adapters supply definitions and instructions.

### 2. Adversarial brainstorming

The innovation architect proposes candidates and the adversarial examiner challenges
them from examination and invalidation perspectives. The moderator consolidates
evidence, follow-up questions, and scores; the path recorder saves the round.
Retaining objections and rejection reasons makes later reassessment possible.

### 3. Parallel evaluation

The security engineer, product compliance analyst, and patentability evaluator
assess different dimensions. They can run in parallel when supported by the host,
then the moderator consolidates their findings.
Runtime thresholds read saved innovation scores; see
[scoring decisions](./workflow-diagram-en.md#scoring-decisions).

### 4. Review and technical response

Reviewers raise issues and the technical responder answers them with proposed
locations for changes in `MAIN.md`. The adversarial examiner and security engineer
add their domain-specific concerns.
Archimedes' instructions call for two consecutive rounds without new issues before
final polishing. This orchestration rule is separate from allowed state transitions;
the state machine itself does not count QA issues.

### 5. Decision recording and recovery

At the end of a round, the path recorder saves agent-output references, innovations,
scores, and decisions. Query a round, branch from a node, or restore a recorded
innovation. Recovery uses saved material; it does not reconstruct unsaved conversation.

See [project files](./architecture-en.md#project-files) and
[path commands](./usage-en.md#decision-paths).
