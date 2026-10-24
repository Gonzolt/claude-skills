# 技术规格：检索模块优化

> 分支：`feat/retrieval-optimization`
> 日期：2026-07-15
> 关联 PRD：`docs/RETRIEVAL_PRD.md`
> 状态：待确认

---

## 1. 变更范围总览

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/core/router.ts` | 修改 | SEARCH query 提取 + 参数解析 + 新增模式 |
| `src/core/workflow.ts` | 修改 | BRAINSTORM_R1 → RESEARCH 回退转换 |
| `src/core/state.ts` | 修改 | 回退时 RESEARCH 状态重置为 pending |
| `src/agents/archimedes.ts` | 修改 | 新增 RE_SEARCH action |
| `src/agents/patent-init-sentinel.md` | 新增 | 初始化哨兵 agent：MCP/工具/运行时/项目状态检测 |
| `src/core/init-checker.ts` | 新增 | TS 检测工具：`runFullCheck()` + `formatReport()` |
| `src/commands/patent-check.md` | 新增 | `/patent-check` 命令定义 |
| `src/cli.ts` | 修改 | 新增 `check` domain 入口 |
| `plugin.jsonc` | 修改 | 注册 patent-init-sentinel agent + patent-check command |
| `src/agents/patent-landscape-analyst.md` | 重写 | 查询扩展/多轮/去重/评分/CNIPA/跨领域/特征矩阵/问题映射 |
| `src/skills/prior-art-search/SKILL.md` | 修改 | CNIPA 数据源 + 文件名统一 + 深度信息字段 |
| `src/skills/evidence-card/SKILL.md` | 修改 | 新增法律状态/同族/引证字段定义 |
| `src/agents/archimedes.md` | 修改 | 文件名统一 + 新增产出文件编排 |
| `src/commands/patent-search.md` | 修改 | 文件名统一 |
| `src/core/landscape-schema.ts` | 新增 | landscape 输出 schema 定义 + 校验 |
| `src/core/feature-matrix-schema.ts` | 新增 | 特征对比矩阵 schema 定义 + 校验 |
| `src/core/problem-map-schema.ts` | 新增 | 技术问题映射 schema 定义 + 校验 |
| `tests/unit/router.test.ts` | 修改 | query 提取测试用例 |
| `tests/unit/workflow.test.ts` | 修改 | 回退转换测试用例 |
| `tests/unit/core/landscape-schema.test.ts` | 新增 | schema 校验测试 |
| `tests/unit/core/feature-matrix-schema.test.ts` | 新增 | 特征矩阵 schema 测试 |
| `tests/unit/core/problem-map-schema.test.ts` | 新增 | 问题映射 schema 测试 |
| `tests/unit/core/init-checker.test.ts` | 新增 | 初始化检测工具测试 |
| `tests/integration/archimedes-routing.test.ts` | 修改 | RE_SEARCH 路由测试 |
| `README.md` / `CLAUDE.md` | 修改 | 文件名统一对齐 + 新增产出说明 |

---

## 2. 详细设计

### 2.1 Router — SEARCH query 提取

**文件**：`src/core/router.ts`

#### 2.1.1 新增 SEARCH 意图模式

```typescript
[IntentType.SEARCH]: [
  // 现有
  { pattern: /(检索|搜索|查找).{0,10}(现有技术|专利|文献)/, confidence: 0.9 },
  { pattern: /(查一下).{0,10}(相关|类似).{0,20}(专利|技术)/, confidence: 0.85 },
  // 新增：中文变体
  { pattern: /(检索|搜索|查找).{0,10}(专利|文献|现有技术|prior art)/i, confidence: 0.88 },
  { pattern: /(帮我查).{0,15}(专利|技术|文献)/, confidence: 0.85 },
  { pattern: /(找一下).{0,10}(相关|类似).{0,20}(专利|技术|文献)/, confidence: 0.85 },
  // 新增：英文
  { pattern: /(search|find|look up).{0,15}(patent|prior art|literature)/i, confidence: 0.88 },
  { pattern: /(prior art search)/i, confidence: 0.95 },
],
```

#### 2.1.2 query 提取逻辑

在 `classifyIntent` 函数的 SEARCH 分支中增加提取：

```typescript
if (bestMatch.type === IntentType.SEARCH) {
  // 提取检索目标词：去掉动词前缀，去掉范围/法域修饰词
  const queryMatch =
    normalizedInput.match(/(?:检索|搜索|查找|查一下|找一下|帮我查)\s*(.{2,80}?)(?:的|相关|类似|的相关|的类似)?\s*(?:专利|文献|现有技术|prior art|技术)/i) ||
    normalizedInput.match(/(?:search|find|look up)\s+(.{2,80}?)(?:\s+patent|\s+prior art|\s+literature)/i);
  if (queryMatch) {
    result.extracted = { query: queryMatch[1].trim() };
  }

  // 提取可选参数
  const scopeMatch = normalizedInput.match(/(近|最近)?\s*(\d+)\s*年/);
  if (scopeMatch) {
    const years = parseInt(scopeMatch[2], 10);
    if (!result.extracted) result.extracted = {};
    result.extracted.scope = years <= 1 ? '1year' : years <= 3 ? '3years' : years <= 5 ? '5years' : years <= 10 ? '10years' : 'all';
  }

  const jurisdictionMatch = normalizedInput.match(/(国内|中国|CN)|(美国|US)|(欧洲|EP)|(日本|JP)|(PCT|国际)/);
  if (jurisdictionMatch) {
    if (!result.extracted) result.extracted = {};
    result.extracted.jurisdiction = jurisdictionMatch[1] ? 'CN' : jurisdictionMatch[2] ? 'US' : jurisdictionMatch[3] ? 'EP' : jurisdictionMatch[4] ? 'JP' : 'PCT';
  }
}
```

#### 2.1.3 IntentResult 扩展

```typescript
export interface IntentResult {
  type: IntentType;
  confidence: number;
  extracted?: {
    topic?: string;
    query?: string;      // 已有，现在会被填充
    scope?: string;      // 新增
    jurisdiction?: string; // 新增
  };
}
```

---

### 2.2 Workflow — BRAINSTORM_R1 → RESEARCH 回退

**文件**：`src/core/workflow.ts`

#### 2.2.1 转换表修改

```typescript
const VALID_TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  // ... 其他不变
  [WorkflowStage.BRAINSTORM_R1]: [WorkflowStage.BRAINSTORM_R2, WorkflowStage.RESEARCH],  // 新增 RESEARCH
  // ...
};
```

#### 2.2.2 transition 方法增强

回退到 RESEARCH 时，需要将 RESEARCH 从 `completed` 中移除（重新激活）：

```typescript
transition(target: WorkflowStage): void {
  if (!this.canTransition(target)) {
    throw new Error(`Invalid transition from ${this.current} to ${target}`);
  }
  this.completed.add(this.current);
  this.current = target;

  // 回退场景：目标阶段已在 completed 中，需要重新激活
  if (this.completed.has(target)) {
    this.completed.delete(target);
  }
}
```

> **注意**：此修改不影响正常前进流程（前进时 target 不在 completed 中，`delete` 是 no-op）。仅在回退时生效。

---

### 2.3 Archimedes — RE_SEARCH action

**文件**：`src/agents/archimedes.ts`

```typescript
case IntentType.SEARCH:
  // 如果当前在 BRAINSTORM_R1 阶段，说明是补检
  if (context.existingState?.current_stage === 'BRAINSTORM_R1') {
    return {
      action: 'RE_SEARCH',
      extractedData: intent.extracted,
      message: '检测到补检请求，回退到 RESEARCH 阶段'
    };
  }
  return {
    action: 'EXECUTE_SEARCH',
    extractedData: intent.extracted
  };
```

---

### 2.3b 初始化哨兵 — init-checker.ts

**文件**：`src/core/init-checker.ts`（新增）+ `src/agents/patent-init-sentinel.md`（新增）

#### TS 检测工具

```typescript
export type CheckStatus = 'ready' | 'missing' | 'warning';

export interface CheckResult {
  category: 'mcp' | 'tool' | 'runtime' | 'project';
  name: string;
  status: CheckStatus;
  detail: string;
  guidance?: string;
}

export interface InitReport {
  timestamp: string;
  adapter: string;           // 'Claude Code' | 'Codex' | 'OpenCode' | 'Unknown'
  workspaceDir: string;
  results: CheckResult[];
  blockingCount: number;     // tool/runtime missing count
  warningCount: number;      // mcp missing + all warning count
  ready: boolean;            // blockingCount === 0
  summary: string;
}

export function checkMcpServers(workspaceDir: string): CheckResult[];
export function checkExternalTools(): CheckResult[];
export function checkRuntime(workspaceDir: string): CheckResult[];
export function checkProjects(workspaceDir: string): CheckResult[];
export function runFullCheck(options: { workspaceDir?: string }): InitReport;
export function formatReport(report: InitReport): string;
```

#### MCP 配置读取

从以下路径读取 MCP 服务器配置：
- Claude Code: `.claude/settings.json` → `mcpServers` 字段
- OpenCode: `opencode.jsonc` → `mcpServers` 字段（需去注释后 JSON.parse）；若工作区无 `opencode.jsonc`，回退读取随仓库发布的 `opencode.jsonc.example` 模板

#### 必检项

| 类别 | 名称 | 阻塞? | 检测方式 |
|------|------|-------|---------|
| MCP | google_scholar | 否 | 配置文件存在 key |
| MCP | uspto_patent | 否 | 配置文件存在 key |
| MCP | semantic_scholar | 否 | 配置文件存在 key |
| MCP | cnipa_patent | 否 | 配置文件存在 key |
| Tool | mmdc | 是 | `mmdc --version` |
| Tool | git | 是 | `git --version` |
| Tool | plantuml-server | 否 | `curl` 检测 URL 可达性 |
| Runtime | node | 是 | `node --version`，>= v22 |
| Runtime | workspace-writable | 是 | 创建临时目录测试 |

#### CLI 集成

```bash
oh-my-patent check                          # 输出到终端
oh-my-patent check --output report.md       # 输出到文件
```

#### Agent 提示集成

`patent-init-sentinel.md` 在 INIT 阶段被 archimedes 调用，执行检测并输出就绪报告。agent 可以额外执行 TS 工具无法覆盖的智能判断（如法域与数据源匹配、缺失项影响评估）。

---

### 2.4 Landscape Schema

**文件**：`src/core/landscape-schema.ts`（新增）

```typescript
export interface LandscapeEntry {
  id: string;           // [R#] 编号
  type: 'patent' | 'paper' | 'standard';
  title: string;
  source: string;       // USPTO / CNIPA / Google Scholar / ...
  year: number;
  relevance: number;    // 0-5
  authors?: string;     // 论文才有
  applicant?: string;   // 专利才有
  ipcCodes?: string[];  // 专利分类号
  citationCount?: number;
}

export interface LandscapeMeta {
  topic: string;
  searchDate: string;   // ISO 8601
  keywords: string[];
  timeRange: string;    // e.g. "2021-2026"
  sources: string[];
}

export interface ParsedLandscape {
  meta: LandscapeMeta;
  entries: LandscapeEntry[];
  referenceTable: Map<string, LandscapeEntry>;  // [R#] → entry
  statistics: {
    patentCount: number;
    paperCount: number;
    standardCount: number;
    totalCitations: number;
    averageYear: number;
  };
}

export function parseLandscape(markdown: string): ParsedLandscape;
export function validateLandscape(parsed: ParsedLandscape): { valid: boolean; errors: string[] };
```

**校验规则**：
1. meta 字段非空
2. entries 数组非空
3. `[R#]` 编号从 R1 开始连续无断号
4. relevance 在 0-5 范围内
5. year 在 1900-当前年份范围内
6. statistics 与 entries 一致（计数匹配）

---

### 2.5 Agent 提示重写

**文件**：`src/agents/patent-landscape-analyst.md`

重写为以下结构（关键变化点）：

```markdown
<!-- Agent: patent-landscape-analyst | Role: subagent -->
<!-- Permissions: write, mcp -->

你是专利检索代理。

## 任务
聚合多源 MCP 检索结果，生成去重、评分后的证据集合，并落库到 references/。

## 数据源
| 源 | 类型 | 优先级 | 备注 |
|----|------|--------|------|
| google_scholar | 学术文献 | 必需 | 跨学科学术检索 |
| uspto_patent | 美国专利 | 推荐 | 含全文和分类号 |
| semantic_scholar | 学术文献 | 可选 | AI 相关度排序 + 引用图 |
| cnipa_patent | 中国专利 | 推荐 | CN 法域必需，IPC 分类号 |

## 检索策略

### 1. 查询扩展
- 从原始关键词派生同义词（中英文对照）
- 查找对应 IPC/CPC 分类号
- 组合检索式：关键词 OR 同义词 + 分类号限定

### 2. 多轮检索
- **首轮**：广检，每源 max 10 条，收集全貌
- **聚类分析**：按技术路线聚类，识别空白区
- **补检轮**：针对空白区用扩展关键词定向补检

### 3. 去重规则
- 同一专利号 → 重复
- 标题相似度 > 80%（编辑距离）→ 视为重复，保留引用数更高的
- 同一作者/申请人 + 相似标题 → 标注关联

### 4. 评分维度
| 维度 | 权重 | 说明 |
|------|------|------|
| 相关度 | 0.5 | 0-5 星，与技术主题的匹配度 |
| 影响力 | 0.3 | 引用数归一化（0-5） |
| 时效性 | 0.2 | 近 2 年=5, 3-5 年=3, >5 年=1 |

综合分 = 相关度×0.5 + 影响力×0.3 + 时效性×0.2（满分 5）

### 5. 增量补检
- 收到 BRAINSTORM_R1 的补检请求时，在已有 landscape 基础上追加
- 补检结果编号从已有最大 R# 后续编
- landscape 文件更新为 `references/landscape_round{r}.md`（r = 补检轮次）

## 输出要求
- 主文件：`references/landscape_{topic_slug}.md`
- 证据卡片：`references/{source}_{id}.md`
- 引用格式：`[R#]` 编号
- 默认每源最多 5 条，默认近 5 年

## 输入示例
...（保留现有示例，增加补检输入示例）

## 补检输入示例
```json
{
  "mode": "incremental",
  "existingLandscape": "references/landscape_federated-learning.md",
  "gapKeywords": ["local differential privacy", "edge computing"],
  "reason": "BRAINSTORM_R1 发现 LDP 方向检索不足"
}
```
```

---

### 2.6 文件名统一规则

| 用途 | 文件名 | 说明 |
|------|--------|------|
| 主检索报告 | `references/landscape_{topic_slug}.md` | 首次检索产出 |
| 多轮检索 | `references/landscape_round{r}.md` | r=2,3,... 补检轮次 |
| 证据卡片 | `references/{source}_{id}.md` | 不变 |
| 特征对比矩阵 | `references/feature-matrix_{topic_slug}.md` | 新增 |
| 技术问题映射 | `references/problem-map_{topic_slug}.md` | 新增 |
| INIT 占位 | 无 | 不再生成占位文件 |

---

### 2.7 特征对比矩阵 Schema

**文件**：`src/core/feature-matrix-schema.ts`（新增）

```typescript
export interface TechFeature {
  id: string;              // F1, F2, ...
  name: string;            // 特征名称，如"客户端噪声注入"
  category: string;        // 分类：架构/算法/协议/硬件/数据结构
  description: string;     // 简述
}

export interface FeatureCell {
  featureId: string;
  refId: string;            // [R#] 或 "INVENTION"
  status: 'present' | 'absent' | 'partial';
  note: string;             // 说明该特征在该文献中的表现
}

export interface FeatureMatrix {
  topic: string;
  generatedDate: string;    // ISO 8601
  features: TechFeature[];
  references: string[];     // ["INVENTION", "R1", "R2", ...]
  cells: FeatureCell[];     // features × references 的笛卡尔积
  differentiators: string[]; // 本发明独有特征 ID 列表
}

export function parseFeatureMatrix(markdown: string): FeatureMatrix;
export function validateFeatureMatrix(parsed: FeatureMatrix): { valid: boolean; errors: string[] };
```

**校验规则**：
1. features 非空，至少 5 个
2. references 包含 "INVENTION" + 至少 3 个 [R#]
3. cells 数量 === features.length × references.length（矩阵完整）
4. 每个高相关度文献至少 3 个 `present` 或 `partial` 的 cell
5. differentiators 至少 1 个（本发明必须有独有特征）
6. 每个 cell 的 refId 在 references 中存在
7. 每个 cell 的 featureId 在 features 中存在

**产出格式示例**：

```markdown
# 技术特征对比矩阵：联邦学习中的差分隐私保护

**生成日期**: 2026-07-15

## 特征定义

| ID | 特征 | 分类 | 说明 |
|----|------|------|------|
| F1 | 客户端噪声注入 | 架构 | 在客户端梯度上添加噪声 |
| F2 | 服务器端噪声注入 | 架构 | 在服务器端聚合时添加噪声 |
| F3 | 隐私预算管理 | 算法 | 跟踪累积隐私损失 |
| ... |

## 对比矩阵

| 特征 | 本发明 | R1 (US10123456) | R2 (CN108234567) | R6 (Abadi) |
|------|--------|-----------------|-------------------|------------|
| F1 客户端噪声 | 有 | 有 | 无 | 有 |
| F2 服务器端噪声 | 有 | 无 | 有 | 无 |
| F3 隐私预算 | 有 | 有 | 有（动态） | 有 |
| F4 异构设备支持 | 有 | 无 | 无 | 无 |
| ... |

## 差异点汇总

本发明独有特征：
- F4 异构设备支持 — 现有技术均未考虑设备计算能力差异
- F7 本地差分隐私 — 无需信任服务器
```

---

### 2.8 技术问题-方案映射 Schema

**文件**：`src/core/problem-map-schema.ts`（新增）

```typescript
export interface ExistingSolution {
  refId: string;            // [R#]
  approach: string;          // 方案描述
  limitation: string;        // 局限性
}

export interface TechProblem {
  id: string;                // P1, P2, ...
  problem: string;           // 问题简述
  existingSolutions: ExistingSolution[];
  unresolvedGap: string;     // 尚未解决的方面
}

export interface ProblemMap {
  topic: string;
  generatedDate: string;
  problems: TechProblem[];
}

export function parseProblemMap(markdown: string): ProblemMap;
export function validateProblemMap(parsed: ProblemMap): { valid: boolean; errors: string[] };
```

**校验规则**：
1. problems 非空，至少 3 个
2. 每个 problem 的 existingSolutions 至少 2 个
3. 每个 existingSolution 的 refId 是合法 [R#] 格式
4. unresolvedGap 非空
5. 同一 refId 可以出现在不同 problem 的 solutions 中

---

### 2.9 Evidence Card Schema 增强

**文件**：`src/skills/evidence-card/SKILL.md`（修改）

在现有 card 格式基础上新增 4 个深度信息段落：

```markdown
## 法律状态
- Status: granted | pending | lapsed | withdrawn
- Jurisdiction: CN | US | EP | JP
- Expiration: YYYY-MM-DD（如已知）

## 同族专利
| 法域 | 专利号 | 状态 |
|------|--------|------|
| CN | CN108234567A | granted |
| US | US10123456B2 | granted |
| EP | EP3456789A1 | pending |

## 引证关系

### 前向引证（被引用）
- [R3] Title (2023) — 引用了本专利的 Claim 1
- [R5] Title (2022) — 引用了本专利的 Claim 1, 3
...（max 10）

### 后向引证（引用了）
- [D1] Title (2018) — 被本专利引用
- [D2] Title (2019) — 被本专利引用
...（max 10）
```

**校验规则**（evidence-card schema 扩展）：
1. 高相关度（>= 4 星）的 card 必须有法律状态段落
2. 专利类型的 card 必须有同族专利段落（即使只有自身一条）
3. 引证列表每方向最多 10 条
4. 引证中的 [R#] / [D#] 编号格式正确

---

### 2.10 Landscape 增强章节

**文件**：`src/agents/patent-landscape-analyst.md`（在 §3 技术趋势总结中新增）

在现有 landscape.md 的"§3 技术趋势总结"后追加三个子节：

```markdown
### 3.3 性能指标对比表

| 方案 | 吞吐量 | 延迟 | 资源开销 | 安全强度 | 来源 |
|------|--------|------|---------|---------|------|
| 客户端噪声注入 | 500 TPS | 100ms | 高 | 高 | [R1] |
| 服务器端噪声注入 | 1000 TPS | 50ms | 中 | 中 | [R2] |
| 混合方案 | 800 TPS | 80ms | 高 | 高 | [R9] |

> 注：性能数据来自对应文献的实验部分，非实测。

### 3.4 商业实现与竞品

| 产品/系统 | 厂商 | 技术方案 | 上市时间 | 规模 | 来源 |
|----------|------|---------|---------|------|------|
| Federated AI | IBM | 客户端噪声 | 2022 | 企业级 | [R3] |
| OpenMined PySyft | 开源社区 | 安全多方计算 | 2021 | 开源 | [R8] |

### 3.5 跨领域参考

| 来源领域 | 参考方案 | 可迁移技术 | 迁移难度 | 来源 |
|---------|---------|-----------|---------|------|
| 数据库安全 | 差分隐私 SQL 查询 | 噪声预算分配策略 | 低 | [R12] |
| 物联网安全 | 边缘设备联邦聚合 | 异构设备聚合协议 | 中 | [R14] |
```

**约束**：
- 性能指标表至少覆盖 3 个主流方案
- 竞品表至少 2 个商业实现
- 跨领域至少 2 个相邻领域，每领域至少 2 条参考
- 所有数据有 [R#] 引用

---

### 2.11 Agent 提示增强（产出层）

**文件**：`src/agents/patent-landscape-analyst.md`（在 §5 增量补检后追加）

```markdown
### 6. 特征对比矩阵生成
- 检索完成后，从所有条目中提取技术特征（去重后 15-30 个）
- 特征按类别分组：架构 / 算法 / 协议 / 硬件 / 数据结构
- 生成本发明与每篇高相关度文献的逐特征对比表
- 产出：references/feature-matrix_{topic_slug}.md

### 7. 技术问题映射生成
- 从检索结果中识别技术问题（至少 3 个）
- 每个问题关联已有方案（引用 [R#]）和局限性
- 明确尚未解决的缺口
- 产出：references/problem-map_{topic_slug}.md

### 8. 深度信息补充
- 对高相关度（>= 4 星）的专利，查询法律状态和同族信息
- 查询前向引证（最多 10 条）和后向引证（最多 10 条）
- 信息写入对应的 evidence card

### 9. 性能与竞品分析
- 从检索结果中提取各方案的性能指标
- 识别商业实现和竞品产品
- 在 landscape.md §3 中补充性能对比表和竞品表

### 10. 跨领域检索
- 识别原始技术领域
- 推导 2-3 个相邻领域
- 对相邻领域执行定向检索（每源 max 3 条）
- 在 landscape.md §3.5 中补充跨领域参考
```

---

## 3. 测试计划

### 3.1 Router 测试

**文件**：`tests/unit/router.test.ts`

| 测试用例 | 输入 | 期望 |
|----------|------|------|
| 提取中文 query | "检索区块链支付相关专利" | `extracted.query` 含 "区块链支付" |
| 提取英文 query | "search for federated learning patents" | `extracted.query` 含 "federated learning" |
| 提取 scope | "检索近3年零知识证明专利" | `extracted.scope === "3years"` |
| 提取 jurisdiction | "检索国内同态加密专利" | `extracted.jurisdiction === "CN"` |
| 无参数默认 | "检索区块链专利" | `extracted.query` 有值，无 scope/jurisdiction |
| 补检意图 | "补检同态加密相关专利" | SEARCH 意图，`extracted.query` 有值 |

### 3.2 Workflow 测试

**文件**：`tests/unit/workflow.test.ts`

| 测试用例 | 操作 | 期望 |
|----------|------|------|
| BRAINSTORM_R1 → RESEARCH 回退 | transition(RESEARCH) | 成功，currentStage = RESEARCH |
| 回退后 RESEARCH 重新激活 | 回退后检查 | `isCompleted(RESEARCH) === false` |
| 回退后可再次前进 | RESEARCH → BRAINSTORM_R1 | 成功 |
| 正常前进不受影响 | INIT → RESEARCH → BRAINSTORM_R1 | 与现有行为一致 |

### 3.3 Landscape Schema 测试

**文件**：`tests/unit/core/landscape-schema.test.ts`

| 测试用例 | 输入 | 期望 |
|----------|------|------|
| 合法样本 | 标准 landscape.md | parse + validate 通过 |
| 缺引用表 | 无 `[R#]` 编号 | validate 失败，报 "missing reference table" |
| R# 断号 | R1, R2, R4（缺 R3） | validate 失败，报 "non-sequential reference numbers" |
| 相关度越界 | relevance = 6 | validate 失败，报 "relevance out of range" |
| 统计不一致 | patentCount=5 实际=3 | validate 失败，报 "statistics mismatch" |
| 性能指标表缺失 | landscape 无 §3.3 | validate 警告（非失败），报 "missing performance table" |

### 3.4 Feature Matrix Schema 测试

**文件**：`tests/unit/core/feature-matrix-schema.test.ts`

| 测试用例 | 输入 | 期望 |
|----------|------|------|
| 合法矩阵 | 特征×文献完整矩阵 | parse + validate 通过 |
| 特征不足 | features.length = 3 | validate 失败，报 "insufficient features (min 5)" |
| 文献不足 | references 不含 INVENTION | validate 失败，报 "missing INVENTION column" |
| 矩阵不完整 | cells 数量 != features × references | validate 失败，报 "incomplete matrix" |
| 无差异点 | differentiators 为空 | validate 失败，报 "no differentiators found" |
| 缺特征说明 | feature 无 description | validate 失败，报 "feature missing description" |

### 3.5 Problem Map Schema 测试

**文件**：`tests/unit/core/problem-map-schema.test.ts`

| 测试用例 | 输入 | 期望 |
|----------|------|------|
| 合法映射 | 3+ 问题，每问题 2+ 方案 | parse + validate 通过 |
| 问题不足 | problems.length = 2 | validate 失败，报 "insufficient problems (min 3)" |
| 方案不足 | 某 problem 只有 1 个 solution | validate 失败，报 "problem needs min 2 solutions" |
| 缺未解缺口 | unresolvedGap 为空 | validate 失败，报 "missing unresolved gap" |
| 非法引用 | refId = "X1" | validate 失败，报 "invalid reference format" |

### 3.6 Archimedes 路由测试

**文件**：`tests/integration/archimedes-routing.test.ts`

| 测试用例 | 输入 + 状态 | 期望 |
|----------|-------------|------|
| BRAINSTORM_R1 阶段补检 | "检索同态加密专利" + stage=BRAINSTORM_R1 | `action === 'RE_SEARCH'` |
| RESEARCH 阶段正常检索 | "检索同态加密专利" + stage=RESEARCH | `action === 'EXECUTE_SEARCH'` |
| RE_SEARCH 携带 query | 同上 | `extractedData.query` 有值 |

### 3.7 Init Checker 测试

**文件**：`tests/unit/core/init-checker.test.ts`

| 测试用例 | 输入 | 期望 |
|----------|------|------|
| MCP 配置缺失时报告 missing | 空 workspaceDir | google_scholar status = 'missing' |
| MCP 配置存在时报告 ready | 含 mcpServers 的配置文件 | 对应 MCP status = 'ready' |
| mmdc 可用时报告 ready | 有 mmdc 的环境 | mmdc status = 'ready' |
| Node 版本过低时报告 missing | mock node < v22 | node status = 'missing' |
| 工作目录不可写时报告 missing | mock 只读目录 | workspace-writable status = 'missing' |
| formatReport 输出合法 markdown | 合法 InitReport | 输出包含总览表 + 分类详情 |
| 阻塞项正确计数 | 2 个 missing tool | blockingCount = 2, ready = false |
| 适配器检测正确 | 含 .claude/ 目录 | adapter = 'Claude Code' |

---

## 4. 执行顺序

```
阶段 0（止血）
  ├─ 0.1 文件名统一        ← 改 4 个 .md 文件
  ├─ 0.2 Router query 提取 ← 改 router.ts + 测试
  ├─ 0.3 修复 spec 引用    ← 改 patent-landscape-analyst.md
  └─ 0.4 初始化哨兵        ← 新增 init-checker.ts + agent + command + cli.ts
      ↓（四项全部完成）

阶段 1（可测契约）
  ├─ 1.1 landscape-schema.ts + 测试
  ├─ 1.2 evidence-card schema 扩展 + 测试
  ├─ 1.3 feature-matrix-schema.ts + 测试
  ├─ 1.4 problem-map-schema.ts + 测试
  └─ 1.5 init-checker.test.ts + 测试
      ↓

阶段 2（工作流增强）
  ├─ 2.1 workflow.ts 回退转换
  ├─ 2.2 archimedes.ts RE_SEARCH
  └─ 2.3 测试
      ↓

阶段 3（Agent 提示增强 — 模块层）
  ├─ 3.1 重写 patent-landscape-analyst.md（查询扩展/多轮/去重/评分/CNIPA）
  ├─ 3.2 更新 prior-art-search/SKILL.md（数据源 + 深度字段）
  ├─ 3.3 更新 evidence-card/SKILL.md（法律状态/同族/引证字段）
  └─ 3.4 更新 README/CLAUDE.md
      ↓

阶段 4（Agent 提示增强 — 产出层 P0）
  ├─ 4.1 追加特征对比矩阵生成策略到 agent 提示
  ├─ 4.2 追加技术问题映射生成策略到 agent 提示
  └─ 4.3 测试：验证产出模板与 schema 一致
      ↓

阶段 5（Agent 提示增强 — 产出层 P1）
  ├─ 5.1 追加深度信息补充策略（法律状态/同族/引证）
  ├─ 5.2 更新 archimedes.md 编排（新增产出文件路径）
  └─ 5.3 测试
      ↓

阶段 6（产出层 P2 + 收尾）
  ├─ 6.1 追加性能指标 + 竞品对比策略
  ├─ 6.2 追加跨领域检索策略
  ├─ 6.3 MCP 配置检测
  └─ 6.4 全量 lint + test
```

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 文件名统一改变已有命名 | 旧引用失效 | 直接替换，不保留别名；已有项目重新跑检索 |
| 回退转换破坏状态机不变量 | 已完成阶段被重新激活 | 仅允许 BRAINSTORM_R1 → RESEARCH，不扩散到其他阶段 |
| schema 校验过严导致 agent 产出被误判 | 阻塞流程 | 校验返回 errors 列表而非抛异常，由上层决定是否阻塞 |
| agent 提示变更影响已有项目 | 检索行为变化 | 直接替换，不向下兼容旧提示 |
| 特征矩阵/问题映射产出质量低 | 下游章节论证薄弱 | schema 校验最低数量要求；agent 提示含产出模板示例 |
| 深度信息（法律状态/同族）MCP 不可用 | 数据缺失 | evidence card 标注"信息不可获取"，不阻塞流程 |
| 产出文件增多导致 references/ 膨胀 | 目录混乱 | 产出文件命名规范统一，archimedes.md 编排产物清单 |
| 跨领域检索偏离主题 | 噪声参考 | 限制每源 max 3 条，标注迁移难度评估 |

---

## 6. 构建与验证

```bash
# 构建
npm run build

# 类型检查
npm run lint

# 测试
npm test

# 验证文件名一致性
grep -rn "landscape" src/ docs/ README*.md CLAUDE.md

# 验证无悬空引用
grep -rn "sisyphus" src/
```
