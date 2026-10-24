# oh-my-patent API 设计文档

> ⚠️ **历史快照（v0.1.0，冻结于 2026-06-17）**：本文件是**事后补写**的快照，**不再更新、不参与构建**，
> 文中的「已实现」等状态仅反映当时快照。规格的规范位置是仓库根 [`specs/`](../../specs/)；
> 当前实现以 `src/` 与 `plugin.jsonc` 为准。目录级声明见 [README.md](README.md)。

**版本**: v1.0  
**日期**: 2026-06-17  
**状态**: ✅ 已实现

---

## 1. CLI API

### 1.1 Path 命令 API

#### path init

初始化决策路径目录。

**语法**:
```bash
oh-my-patent path init <project-path>
```

**返回**:
```json
{
  "ok": true,
  "pathId": "path-uuid",
  "message": "Initialized brainstorm path"
}
```

---

#### path record

记录一轮头脑风暴数据。

**语法**:
```bash
oh-my-patent path record <project-path> --round <N> --data <json|@file>
```

**参数**:
- `--round`: 轮次编号（≥ 1）
- `--data`: JSON 数据或 @file 路径

**数据格式**:
```json
{
  "projectId": "proj-123",
  "topic": "同态加密隐私计算",
  "agentOutputs": {
    "innovation-architect": "references/brainstorm_round1_architect.md"
  },
  "innovations": [
    {
      "id": "INN-001",
      "title": "基于同态加密的多方安全计算协议",
      "description": "...",
      "technicalDetails": "..."
    }
  ],
  "scores": [
    {
      "innovationId": "INN-001",
      "novelty": 8,
      "creativity": 7,
      "practicality": 9,
      "composite": 8.0,
      "rationale": "..."
    }
  ],
  "decision": {
    "action": "CONTINUE" | "PASS_TO_DRAFT" | "FORCE_PASS",
    "reason": "..."
  }
}
```

**返回**:
```json
{
  "ok": true,
  "nodeId": "round-1",
  "pathId": "path-uuid",
  "totalNodes": 1,
  "status": "active"
}
```

---

#### path overview

获取路径概览。

**语法**:
```bash
oh-my-patent path overview <project-path>
```

**返回**:
```json
{
  "ok": true,
  "pathId": "path-uuid",
  "projectId": "proj-123",
  "topic": "同态加密隐私计算",
  "status": "active",
  "totalNodes": 2,
  "currentNode": "round-2",
  "branches": ["branch-1"],
  "finalDecision": null
}
```

---

#### path branch

创建分支探索替代方案。

**语法**:
```bash
oh-my-patent path branch <project-path> --from-node <id> --reason <text>
```

**参数**:
- `--from-node`: 源节点 ID（如 round-1）
- `--reason`: 分支原因描述

**返回**:
```json
{
  "ok": true,
  "branchId": "branch-uuid",
  "fromNode": "round-1",
  "reason": "探索安全多方计算方向",
  "createdAt": "2026-06-17T10:30:00Z"
}
```

---

#### path restore

复活已放弃的创新点。

**语法**:
```bash
oh-my-patent path restore <project-path> --node <id> --innovation <id>
```

**参数**:
- `--node`: 节点 ID
- `--innovation`: 创新点 ID

**返回**:
```json
{
  "ok": true,
  "restoredInnovation": {
    "id": "INN-003",
    "title": "...",
    "originalNode": "round-1",
    "restoredAt": "2026-06-17T10:35:00Z"
  }
}
```

---

#### path threshold

评估阈值是否通过。

**语法**:
```bash
oh-my-patent path threshold <project-path> --round <N>
```

**返回**:
```json
{
  "ok": true,
  "round": 2,
  "topInnovation": "INN-001",
  "decisions": {
    "INN-001": {
      "passed": true,
      "noveltyPassed": true,
      "creativityPassed": true,
      "compositePassed": true,
      "suggestions": []
    }
  }
}
```

---

### 1.2 Diagram 命令 API

#### diagram render

批量渲染图表。

**语法**:
```bash
oh-my-patent diagram render <project-path> --specs <json|@file> [--phase <draft|final>]
```

**Specs 格式**:
```json
[
  {
    "figureId": "fig-001",
    "title": "系统架构图",
    "source": "graph TD\n  A --> B\n  B --> C",
    "engine": "mermaid",
    "phase": "draft"
  }
]
```

**返回**:
```json
{
  "ok": true,
  "projectPath": "/path/to/project",
  "phase": "draft",
  "renderCount": 3,
  "successCount": 3,
  "figuresDir": "/path/to/project/figures",
  "results": [
    {
      "figureId": "fig-001",
      "success": true,
      "svg": "figures/001-system.svg",
      "png": "figures/001-system.png"
    }
  ],
  "mainUpdated": true
}
```

---

#### diagram status

查看已渲染图表清单。

**语法**:
```bash
oh-my-patent diagram status <project-path>
```

**返回**:
```json
{
  "ok": true,
  "projectPath": "/path/to/project",
  "figuresDir": "/path/to/project/figures",
  "hasManifest": true,
  "figureCount": 3,
  "figures": [
    {
      "figureNumber": 1,
      "figureId": "fig-001",
      "title": "系统架构图",
      "phase": "draft",
      "files": {
        "svg": "001-system.svg",
        "png": "001-system.png",
        "source": "001-system.mmd"
      }
    }
  ]
}
```

---

### 1.3 Adapt 命令 API

#### adapt setup

安装编辑器配置（推荐入口）。

**语法**:
```bash
oh-my-patent adapt setup [--tool <claude-code|codex>] [--workspace-dir <dir>]
```

**参数**:
- `--tool`: 指定工具（默认全部）
- `--workspace-dir`: 工作区目录（默认当前目录）

**返回**:
```json
{
  "ok": true,
  "adapter": "claude-code",
  "files": 22,
  "installed": "/path/to/workspace"
}
```

---

#### adapt uninstall

卸载编辑器配置。

**语法**:
```bash
oh-my-patent adapt uninstall [--tool <name>] [--workspace-dir <dir>]
```

**返回**:
```json
{
  "ok": true,
  "adapter": "claude-code",
  "removed": 22,
  "skipped": 0,
  "message": "Uninstalled claude-code. Removed 22, skipped 0."
}
```

---

## 2. TypeScript API

### 2.1 决策路径 API

```typescript
import {
  createInitialPath,
  createInitialNode,
  savePath,
  loadPath,
  saveNode,
  loadNode
} from 'oh-my-patent/core/path-persistence';

import {
  BrainstormPath,
  BrainstormNode,
  InnovationSnapshot
} from 'oh-my-patent/core/brainstorm-path';

// 创建路径
const path = createInitialPath('proj-123', '同态加密隐私计算');
await savePath(path, '/path/to/project');

// 加载路径
const loaded = await loadPath('/path/to/project');

// 创建节点
const node = createInitialNode(1);
node.agentOutputs['architect'] = 'references/brainstorm_r1.md';
await saveNode(node, '/path/to/project');
```

---

### 2.2 状态机 API

```typescript
import {
  initWorkflowState,
  loadState,
  saveState,
  transitionTo
} from 'oh-my-patent/core/state-manager';

// 初始化状态
const state = initWorkflowState();
await saveState(state, '/path/to/project');

// 状态转换
state.stage = 'RESEARCH';
await saveState(state, '/path/to/project');

// 加载状态
const loaded = await loadState('/path/to/project');
```

---

### 2.3 图表渲染 API

```typescript
import { DiagramRenderer } from 'oh-my-patent/core/diagram-renderer';
import { FigureSpec } from 'oh-my-patent/core/diagram-types';

const renderer = new DiagramRenderer();

const specs: FigureSpec[] = [
  {
    figureId: 'fig-001',
    title: '系统架构图',
    source: 'graph TD\n  A --> B',
    engine: 'mermaid',
    phase: 'draft'
  }
];

const results = await renderer.renderAll(specs, '/path/to/figures');

// 重新渲染单图
await renderer.rerender(
  'fig-001',
  'graph TD\n  A --> B --> C',
  '/path/to/figures',
  'mermaid'
);
```

---

### 2.4 阈值评估 API

```typescript
import {
  evaluateThreshold,
  evaluateAllThresholds,
  generateImprovementSuggestions,
  DEFAULT_THRESHOLD_CONFIG
} from 'oh-my-patent/core/threshold-config';

// 评估单个创新点
const decision = evaluateThreshold(score, DEFAULT_THRESHOLD_CONFIG, round);

// 评估所有创新点
const allDecisions = evaluateAllThresholds(scores, DEFAULT_THRESHOLD_CONFIG, round);

// 生成改进建议
const suggestions = generateImprovementSuggestions(score, config, decision);
```

---

## 3. 数据模型 API

### 3.1 BrainstormPath

```typescript
interface BrainstormPath {
  id: string;
  projectId: string;
  topic: string;
  nodes: string[];
  edges: Edge[];
  currentNodeId: string;
  status: 'active' | 'completed';
  finalDecision?: FinalDecision;
}
```

### 3.2 BrainstormNode

```typescript
interface BrainstormNode {
  id: string;
  round: number;
  timestamp: string;
  agentOutputs: Record<string, string>;
  innovations: InnovationSnapshot[];
  scores: InnovationScore[];
  decision: NodeDecision;
}
```

### 3.3 InnovationScore

```typescript
interface InnovationScore {
  innovationId: string;
  novelty: number;           // 1-10
  creativity: number;        // 1-10
  practicality: number;      // 1-10
  composite: number;         // 加权平均
  rationale: string;
}
```

### 3.4 WorkflowState

```typescript
interface WorkflowState {
  stage: Stage;
  currentRound?: number;
  qaRound?: number;
  artifacts: Record<string, string>;
  timestamp: string;
}

type Stage = 
  | 'INIT' | 'RESEARCH' | 'BRAINSTORM_R1' | 'BRAINSTORM_R2'
  | 'DRAFT' | 'QA_LOOP' | 'FINAL_REVIEW' | 'DIAGRAM' | 'DONE';
```

---

## 4. 错误码

### 4.1 CLI 错误码

| 错误码 | 说明 | 示例 |
|--------|------|------|
| 1 | 通用错误 | 参数缺失、文件不存在 |
| 2 | 数据验证失败 | JSON 格式错误 |
| 3 | 文件 I/O 错误 | 权限不足 |
| 4 | 渲染引擎错误 | Mermaid CLI 失败 |

### 4.2 API 错误类型

```typescript
// PathNotFoundError
{
  "ok": false,
  "error": "No path data found"
}

// NodeNotFoundError
{
  "ok": false,
  "error": "Node round-3 not found"
}

// RenderFailedError
{
  "ok": false,
  "error": "Mermaid rendering failed: syntax error"
}
```

---

## 5. 性能指标

### 5.1 CLI 命令性能

| 命令 | 平均耗时 | P95 耗时 |
|------|---------|---------|
| path init | < 50ms | < 100ms |
| path record | < 200ms | < 500ms |
| path overview | < 100ms | < 200ms |
| diagram render (单图) | < 10s | < 20s |
| adapt setup | < 2s | < 5s |

### 5.2 API 性能

| API | 平均耗时 | P95 耗时 |
|-----|---------|---------|
| savePath() | < 50ms | < 100ms |
| loadPath() | < 30ms | < 80ms |
| saveNode() | < 50ms | < 100ms |
| renderAll() | < 30s (3图) | < 60s |

---

## 6. 版本兼容性

### 6.1 数据格式版本

当前数据格式版本: **v1**

**升级策略**:
- 保持向后兼容（读取旧版本）
- 自动迁移（写入新版本）
- 版本号记录在 `path.json` 的 `version` 字段

### 6.2 API 版本策略

- **Major 版本** (v1 → v2): 破坏性更改
- **Minor 版本** (v1.0 → v1.1): 新增功能，向后兼容
- **Patch 版本** (v1.0.0 → v1.0.1): Bug 修复

---

**文档版本**: v1.0  
**最后更新**: 2026-06-17
