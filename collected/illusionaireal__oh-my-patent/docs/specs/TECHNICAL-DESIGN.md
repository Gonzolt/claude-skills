# oh-my-patent 技术设计规格

> ⚠️ **历史快照（v0.1.0，冻结于 2026-06-17）**：本文件是**事后补写**的快照，**不再更新、不参与构建**，
> 文中的「已实现」等状态仅反映当时快照。规格的规范位置是仓库根 [`specs/`](../../specs/)；
> 当前实现以 `src/` 与 `plugin.jsonc` 为准。目录级声明见 [README.md](README.md)。

**版本**: v1.0  
**日期**: 2026-06-17  
**状态**: ✅ 已实现  

---

## 1. 系统架构

### 1.1 整体架构（四层架构）

```
用户接口层: CLI | TUI | Claude Code Plugin | Codex Plugin
     ↓
编排层: Archimedes Orchestrator | Agent Router | Skill Registry
     ↓
引擎层: Path Engine | State Engine | Diagram Engine | Threshold
     ↓
适配器层: Claude Code Adapter | Codex Adapter | Config Loader
     ↓
持久化层: .brainstorm/ | .patent/ | references/ | figures/
```

### 1.2 技术栈

| 层级 | 技术选型 | 版本要求 |
|------|---------|---------|
| 运行时 | Node.js | ≥ 18.0.0 |
| 语言 | TypeScript | ≥ 5.0.0 (strict mode) |
| 测试 | Vitest | ≥ 1.0.0 |
| CLI | Commander.js | ≥ 11.0.0 |
| TUI | Ink + React | ≥ 4.0.0 |
| 图表渲染 | Mermaid CLI | ≥ 10.0.0 |

---

## 2. 核心模块设计

### 2.1 决策路径引擎

**文件**: `src/core/brainstorm-path.ts`

**职责**:
- 定义决策路径数据模型
- 提供 DAG 结构操作接口
- 实现分叉和回退算法

**核心数据结构**:
```typescript
export interface BrainstormPath {
  id: string;
  projectId: string;
  topic: string;
  nodes: string[];
  edges: Edge[];
  currentNodeId: string;
  status: 'active' | 'completed';
  finalDecision?: FinalDecision;
}

export interface BrainstormNode {
  id: string;
  round: number;
  timestamp: string;
  agentOutputs: Record<string, string>;
  innovations: InnovationSnapshot[];
  scores: InnovationScore[];
  decision: NodeDecision;
}
```

**设计决策**:
- 使用有向无环图（DAG）而非链表，支持分支和合并
- 边上携带转换类型（refine/merge/split/pivot）
- 节点和边分离存储，便于增量更新

---

### 2.2 状态机引擎

**文件**: `src/core/state-manager.ts`

**职责**:
- 管理工作流状态转换
- 实现断点续传
- 提供原子性写入保证

**状态定义**:
```typescript
type Stage = 
  | 'INIT' | 'RESEARCH' | 'BRAINSTORM_R1' | 'BRAINSTORM_R2'
  | 'DRAFT' | 'QA_LOOP' | 'FINAL_REVIEW' | 'DIAGRAM' | 'DONE';
```

**状态转换规则**:
- INIT → RESEARCH → BRAINSTORM_R1 → BRAINSTORM_R2
- BRAINSTORM_R2 → BRAINSTORM_R1 (阈值未通过) | DRAFT (通过)
- DRAFT → QA_LOOP → FINAL_REVIEW → DIAGRAM → DONE
- QA_LOOP 最多 6 轮，连续 2 轮无问题则退出

---

### 2.3 图表渲染引擎

**文件**: `src/core/diagram-renderer.ts`

**职责**:
- 调用 Mermaid/PlantUML 渲染引擎
- 批量处理图表规格
- 管理渲染结果和版本

**渲染流程**:
```
FigureSpec[] → Mermaid CLI / PlantUML API → SVG + PNG → figures/
```

**核心接口**:
```typescript
interface FigureSpec {
  figureId: string;
  title: string;
  source: string;
  engine: 'mermaid' | 'plantuml';
  phase: 'draft' | 'final';
}

class DiagramRenderer {
  async renderAll(specs: FigureSpec[], outputDir: string): Promise<RenderResult[]>;
  async rerender(figureId: string, source: string, outputDir: string): Promise<RenderResult>;
}
```

---

## 3. 数据持久化设计

### 3.1 文件布局

```
project-root/
├── .brainstorm/
│   ├── path.json              # 5-50 KB
│   ├── nodes/round-N.json    # 10-100 KB per file
│   ├── snapshots/            # 5-20 KB
│   └── branches/{id}/        # 独立副本
├── .patent/state.json        # 1-5 KB
├── references/*.md           # 20-200 KB each
├── figures/*.svg,*.png       # 5-500 KB each
├── MAIN.md                   # 100-500 KB
└── conversation.md           # 50-300 KB
```

### 3.2 原子写入策略

```typescript
async function savePath(path: BrainstormPath, projectPath: string) {
  const tmpFile = `${pathFile}.tmp`;
  await writeFile(tmpFile, JSON.stringify(path, null, 2));
  await rename(tmpFile, pathFile);  // 原子操作
}
```

---

## 4. 智能体架构

### 4.1 智能体定义格式

每个智能体由一个 Markdown 文件定义：

```markdown
---
name: patent-landscape-analyst
description: 专利检索专家
permissions:
  write: false
  bash: true
  mcp: true
---

# 系统提示词
你是专利检索专家...
```

### 4.2 智能体通信协议

```typescript
interface AgentContext {
  projectId: string;
  topic: string;
  previousOutputs: Record<string, string>;
  currentStage: Stage;
}

interface AgentOutput {
  agentId: string;
  stage: Stage;
  outputFile: string;        // references/xxx.md
  metadata: { timestamp, model, tokens };
}
```

---

## 5. 适配器设计

### 5.1 适配器接口

```typescript
interface ToolAdapter {
  readonly name: string;
  generate(def: PortableDef, config: object): Promise<GenerateResult>;
  uninstall(def: PortableDef, workspaceDir: string): Promise<UninstallResult>;
  getGeneratedFilePaths(def: PortableDef): string[];
}
```

### 5.2 Claude Code 适配器

**生成文件**:
- `.claude/agents/*.md` (13 files)
- `.claude/commands/*.md` (8 files)
- `.claude/settings.json`
- `CLAUDE.md`

**卸载策略**:
- 精确删除已知文件路径（不遍历目录）
- 目录为空时才删除目录
- 安全保证：不删用户自定义文件

---

## 6. CLI 架构

### 6.1 命令结构

```
oh-my-patent <domain> <subcommand> [options]

domains:
  path      - 决策路径操作
  diagram   - 图表渲染
  adapt     - 适配器管理
  tui       - 交互界面
```

### 6.2 JSON 输出格式

```json
{
  "ok": true,
  "data": { ... },
  "message": "Operation successful"
}
```

---

## 7. 性能优化

| 操作 | 优化策略 | 性能提升 |
|------|---------|---------|
| 读取 path.json | 内存缓存 | 10x |
| 写入节点数据 | 异步批量 | 5x |
| 加载智能体 | 懒加载 | 20x |
| 图表渲染 | 并发渲染 | 3x |

---

## 8. 错误处理

### 8.1 错误类型

```typescript
class PathNotFoundError extends Error {}
class StateCorruptedError extends Error {}
class RenderFailedError extends Error {}
class AgentTimeoutError extends Error {}
```

### 8.2 重试策略

- API 调用：3 次重试，指数退避
- 文件 I/O：1 次重试，立即
- 图表渲染：2 次重试，延迟 1s

---

## 9. 测试策略

| 类型 | 数量 | 覆盖率目标 |
|------|------|-----------|
| 单元测试 | 60+ | ≥ 80% |
| 集成测试 | 20+ | ≥ 60% |
| E2E 测试 | 5+ | 关键流程 100% |

**测试命令**:
```bash
npm test                  # 运行所有测试
npm test -- --coverage    # 覆盖率报告
```

---

## 10. 部署架构

### 10.1 npm 包结构

```
oh-my-patent/
├── dist/           # 编译后的 JS
├── docs/           # 文档
├── plugin.jsonc    # 插件定义
└── package.json
```

### 10.2 发布流程

```bash
npm run build      # 构建
npm test           # 测试
npm version patch  # 版本更新
npm publish        # 发布
```

---

**文档版本**: v1.0  
**最后更新**: 2026-06-17
