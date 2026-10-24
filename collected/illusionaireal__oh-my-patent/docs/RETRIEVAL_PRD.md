# PRD：检索模块优化

> 分支：`feat/retrieval-optimization`
> 日期：2026-07-15
> 状态：待确认

---

## 1. 背景

oh-my-patent 的检索能力由 `RESEARCH` 工作流阶段驱动，涉及 4 层：

| 层 | 文件 | 职责 |
|----|------|------|
| 路由 | `src/core/router.ts` | 识别 SEARCH 意图 |
| 编排 | `src/agents/archimedes.ts` + `archimedes.md` | 分配检索任务给子 agent |
| 执行 | `src/agents/patent-landscape-analyst.md` + `src/skills/prior-art-search/SKILL.md` | 调 MCP 多源检索、聚合、评分 |
| 状态 | `src/core/workflow.ts` + `state.ts` | RESEARCH 阶段生命周期管理 |

**核心问题：检索是"编排有骨架、检索没血肉"。** TS 层只做 intent 路由 + 状态机，真正的检索全押在 AI agent prompt + 用户自配的外部 MCP 上，TS 层一行检索实现都没有。

两层缺口：

**A. 模块层缺口（6 个）**：
1. **Router 不提取 query** — SEARCH 意图只匹配不提取关键词，`extracted.query` 始终为空
2. **RESEARCH 单向不可回退** — `RESEARCH → BRAINSTORM_R1` 单向，头脑风暴发现检索缺口后无法补检
3. **缺少中国专利数据源** — 只支持 google_scholar / uspto / semantic_scholar，无 CNIPA
4. **悬空 spec 引用** — agent 引用 `.sisyphus/retrieval_agent_spec.md`，全仓库不存在
5. **Agent 提示过于简陋** — 无查询扩展、多轮检索策略、IPC/CPC 分类引导
6. **无检索专属测试** — 只有状态机/路由基础测试，无 query 提取 / 重检索 / schema 校验测试

**B. 产出层缺口（8 个）** — 当前检索结果对交底书各章节覆盖度仅约 45%，缺失以下关键数据：
1. **技术特征对比矩阵** — 无发明 vs 每篇现有技术的逐特征对比表（影响新颖性论证）
2. **技术问题-方案映射** — 无"问题→已试方案→未解缺口"结构化映射（影响技术问题章节）
3. **法律状态** — 无专利授权/失效/在审状态（影响新颖性判断）
4. **同族专利** — 无 US→CN→EP 对等件信息（CN 法域默认下尤其需要）
5. **引证网络** — 无前向/后向引证关系（影响技术演进判断）
6. **性能指标/实验数据** — 无量化对比基准（影响有益效果论证）
7. **竞品/商业实现** — 无产品级对比，仅学术文献（影响创新空间识别）
8. **跨领域参考** — 无相邻领域可迁移方案（限制创新广度）

---

## 2. 目标

把检索推进到 **可测、可兜底、命名统一、query 自动提取、MCP 配置可感知、支持增量补检、产出覆盖交底书全章节需求**。

**不做的事：**
- 不改变"CLI 不跑 agent"的项目哲学 — 不在 TS 层实现真实 MCP 调用
- 不引入新的运行时依赖
- 不破坏已有状态机约定（显式转换、原子写入）

---

## 3. 功能需求

### 模块层需求（3.1 - 3.7）

### 3.1 Router query 提取（P0）

**需求**：`classifyIntent` 识别 SEARCH 意图时，自动提取搜索关键词到 `extracted.query`。

**验收标准**：
- `classifyIntent("检索区块链支付相关专利")` → `extracted.query` 含 "区块链支付"
- `classifyIntent("search for federated learning patents")` → `extracted.query` 含 "federated learning"
- `classifyIntent("查一下同态加密的现有技术")` → `extracted.query` 含 "同态加密"
- 支持 jurisdiction/scope 参数解析："检索近3年国内零知识证明专利" → `extracted.scope = "3years"`, `extracted.jurisdiction = "CN"`

### 3.2 文件名统一（P0）

**需求**：统一 landscape 文件命名约定，消除三处不一致。

**方案**：
- 主文件：`references/landscape_{topic_slug}.md`
- 多轮检索：`references/landscape_round{r}.md`
- 旧名 `references/landscape.md` 直接废弃，不保留别名

**验收标准**：
- 全局 `grep -rn "landscape" src/ docs/ README*.md CLAUDE.md` 只剩统一命名
- `patent-landscape-analyst.md`、`prior-art-search/SKILL.md`、`archimedes.md`、`patent-search.md` 四处一致

### 3.3 修复悬空 spec 引用（P0）

**需求**：移除 `patent-landscape-analyst.md` 中对 `.sisyphus/retrieval_agent_spec.md` 的引用，将必要契约内联到 agent 提示中。

**验收标准**：
- `grep -rn "sisyphus" src/` 无结果
- agent 提示自包含，不引用外部不存在的文件

### 3.4 RESEARCH 阶段可回退（P1）

**需求**：当 BRAINSTORM_R1 阶段发现检索缺口时，支持回退到 RESEARCH 进行增量补检。

**方案**：
- `VALID_TRANSITIONS[BRAINSTORM_R1]` 增加 `RESEARCH` 作为合法目标
- 新增 `RE_SEARCH` action 到 `archimedes.ts`
- `RE_SEARCH` 携带补检原因和补检关键词

**验收标准**：
- `WorkflowMachine` 从 `BRAINSTORM_R1` 可 `transition(RESEARCH)` 成功
- `ArchimedesOrchestrator` 在 `BRAINSTORM_R1` 阶段收到 "补检同态加密相关专利" 时返回 `RE_SEARCH` action
- 回退后 `RESEARCH` 阶段状态从 `completed` 变为 `pending`（重新激活）

### 3.5 Landscape 输出 Schema 校验（P1）

**需求**：定义 landscape.md 的结构化 schema，使落盘产物可被程序校验。

**方案**：新增 `src/core/landscape-schema.ts`，提供 `parseLandscape(md)` 和 `validateLandscape(parsed)`。

**字段定义**：
- 检索日期（ISO 8601）
- 关键词列表
- 时间范围
- 数据源列表
- 分类条目（专利 / 论文 / 标准）
- `[R#]` 引用编号表（连续无断号）
- 检索统计

**验收标准**：
- 合法 landscape.md 样本 parse + validate 通过
- 缺引用表 / `[R#]` 断号 / 字段类型错的样本 validate 失败并报具体错误

### 3.6 Agent 提示增强（P1）

**需求**：重写 `patent-landscape-analyst.md`，增加：

- **查询扩展策略**：从原始关键词派生同义词、IPC/CPC 分类号、中英文对照词
- **多轮检索指引**：首轮广检 → 聚类分析 → 针对性补检
- **去重规则**：标题相似度 > 80% 或同一专利号视为重复
- **评分维度**：相关度（0-5）、影响力（引用数）、时效性（年份）
- **CNIPA 数据源**：在 agent 提示和 SKILL.md 中新增中国国家知识产权局作为推荐数据源
- **增量补检**：接收 BRAINSTORM_R1 的补检请求时，在已有 landscape 基础上追加而非覆盖

**验收标准**：
- agent 提示自包含，无外部文件引用
- 包含查询扩展、多轮检索、去重、评分、增量补检 5 个策略段落
- SKILL.md 数据源列表包含 CNIPA

### 3.7 初始化哨兵（P1）

**需求**：新增 `patent-init-sentinel` 角色，在项目启动时执行环境检测，确认所有外部依赖就绪。

**检测项**：
1. MCP 服务器可用性（google_scholar / uspto_patent / semantic_scholar / cnipa_patent）
2. 外部工具（mmdc / PlantUML Server / git）
3. 运行时（Node.js 版本 >= 22、工作目录可写）
4. 项目状态（已有项目的 state.json 校验）
5. 适配器目标检测（Claude Code / Codex / OpenCode）
6. 法域相关数据源匹配（CN 法域检查 cnipa_patent，US 法域检查 uspto_patent）

**产出**：
- Agent 提示：`src/agents/patent-init-sentinel.md`
- TS 检测工具：`src/core/init-checker.ts`（`runFullCheck()` + `formatReport()`）
- CLI 命令：`oh-my-patent check`（`/patent-check`）
- 就绪报告：终端输出或 `references/init-report.md`

**验收标准**：
- `oh-my-patent check` 输出结构化就绪报告（含总览表 + 分类详情 + 配置指引）
- `mmdc` 和 `git` 缺失时标记为阻塞项
- MCP 服务器缺失不阻塞，标注对工作流的影响
- 法域与数据源的对应关系正确（CN → cnipa_patent 必需）
- 不修改任何配置文件，不自动安装缺失工具
- `npm run lint` 零错误，`npm test` 全通过

---

### 产出层需求（3.8 - 3.10）— 检索增强产出

> 背景分析：当前检索结果对交底书 7 个章节的覆盖度仅约 45%（背景技术 OK、附图说明 OK、技术问题/方案/效果部分覆盖、实施例/权利要求缺失）。以下需求旨在将覆盖度提升至 85%+。

### 3.8 技术特征对比矩阵（P0）

**需求**：检索后自动生成发明与每篇现有技术的逐特征对比表，支撑新颖性论证和权利要求撰写。

**产出文件**：`references/feature-matrix_{topic_slug}.md`

**结构**：
- 行：从所有检索结果中提取的技术特征（去重后约 15-30 个）
- 列：本发明 + 每篇高相关度现有技术（[R1]、[R2]...）
- 单元格：有/无/部分 + 说明
- 底部：差异点汇总（本发明独有特征列表）

**验收标准**：
- 特征矩阵覆盖 landscape 中相关度 >= 3 星的所有条目
- 每个高相关度文献至少有 3 个特征对比
- 差异点汇总明确列出本发明的独有技术特征
- schema 校验通过

### 3.9 技术问题-方案映射（P0）

**需求**：从检索结果中系统提取"技术问题→已试方案→未解缺口"的结构化映射，支撑交底书"技术问题"章节。

**产出文件**：`references/problem-map_{topic_slug}.md`

**结构**：
```
## 技术问题 1：[问题简述]
- 已有方案：
  - [R1] 方案描述 + 局限性
  - [R6] 方案描述 + 局限性
- 未解缺口：[具体描述尚无方案解决的方面]

## 技术问题 2：...
```

**验收标准**：
- 至少识别 3 个技术问题
- 每个问题至少引用 2 篇现有技术
- 每个问题都有明确的"未解缺口"描述
- 未解缺口可直接作为创新点的切入点

### 3.10 专利深度信息增强（P1）

**需求**：在 evidence-card 中补充 4 项专利深度信息，支撑法域分析和演进判断。

**扩展字段**（evidence-card schema 新增）：

| 字段 | 说明 | 来源 |
|------|------|------|
| `legalStatus` | 授权/在审/失效/撤回 | USPTO/CNIPA API |
| `patentFamily` | 同族专利列表（号 + 法域） | 专利族数据库 |
| `forwardCitations` | 前向引证列表（谁引用了它） | 引证数据库 |
| `backwardCitations` | 后向引证列表（它引用了谁） | 引证数据库 |

**验收标准**：
- evidence-card schema 包含 4 个新字段
- 高相关度文献（>= 4 星）的 evidence card 必须填充 legalStatus
- patentFamily 至少包含本专利号 + 同族中 CN/US 对等件
- 引证列表每方向最多 10 条，按相关度排序

### 3.11 性能指标与竞品对比（P2）

**需求**：检索结果中补充各技术方案的性能指标和商业实现信息，支撑"有益效果"量化论证。

**产出**：在 landscape.md 的技术趋势总结中新增两个子节：

**§3.3 性能指标对比表**：
| 方案 | 吞吐量 | 延迟 | 资源开销 | 来源 |
|------|--------|------|---------|------|
| 方案A | 1000 TPS | 50ms | 高 | [R1] |
| 方案B | 500 TPS | 200ms | 中 | [R6] |

**§3.4 商业实现与竞品**：
| 产品/系统 | 厂商 | 技术方案 | 上市时间 | 来源 |
|----------|------|---------|---------|------|
| Product X | Company Y | ZKP-based | 2023 | [R3] |

**验收标准**：
- 性能指标表至少覆盖 3 个主流技术方案
- 竞品表至少列 2 个商业实现
- 数据有 [R#] 引用来源

### 3.12 跨领域参考检索（P2）

**需求**：检索时自动扩展到相邻技术领域，识别可迁移方案。

**方案**：在 agent 提示中增加"跨领域扩展"策略：
- 识别原始技术领域（如"密码学"）
- 推导相邻领域（如"数据库安全"、"云计算"、"物联网安全"）
- 对相邻领域执行一轮定向检索（每源 max 3 条）
- 在 landscape.md 新增 §3.5 跨领域参考章节

**验收标准**：
- landscape.md 包含跨领域参考章节
- 至少涉及 2 个相邻领域
- 每个相邻领域至少 2 条参考
- 参考条目标注"可迁移技术"和"迁移难度评估"

---

## 4. 非功能需求

| 维度 | 要求 |
|------|------|
| 类型安全 | TypeScript strict 模式，`npm run lint` 零错误 |
| ESM 约定 | 源文件间 import 使用 `.js` 扩展名 |
| 原子写入 | state/path 持久化走 temp + rename |
| 测试镜像 | `tests/unit/core/x.test.ts` ↔ `src/core/x.ts` |
| 无新依赖 | 不引入新的 npm 运行时依赖 |

---

## 5. 不在本次范围

- TS 层检索聚合器（`retrieval-aggregator.ts`）— 需单独决策是否将检索从 AI 层下沉到代码层
- 真实 MCP 服务器实现 — 由用户外部配置
- 专利全文分析 / 权利要求解析 — 属于 agent 智能层
- 法律状态/同族/引证数据的实时 API 对接 — 产出层 3.10 定义 schema，实际数据由 agent 通过 MCP 获取

---

## 6. 里程碑

| 阶段 | 内容 | 优先级 | 依赖 |
|------|------|--------|------|
| 阶段 0 | query 提取 + 文件名统一 + 修复 spec 引用 | P0 | 无 |
| 阶段 1 | landscape schema + evidence card 校验 | P1 | 阶段 0 完成（文件名统一） |
| 阶段 2 | RESEARCH 可回退 + RE_SEARCH action | P1 | 阶段 0 完成 |
| 阶段 3 | Agent 提示增强 + CNIPA 数据源 + 跨领域检索策略 | P1 | 阶段 0 完成 |
| 阶段 4 | 特征对比矩阵 + 技术问题映射（产出层 P0） | P0 | 阶段 1 完成（schema 基础） |
| 阶段 5 | 专利深度信息增强（法律状态/同族/引证） | P1 | 阶段 1 完成 |
| 阶段 6 | 性能指标 + 竞品对比 + 跨领域参考 + MCP 检测 + 测试补全 | P2 | 阶段 3/4/5 完成 |

阶段 0 三项互相独立，可并行。阶段 1/2/3 互相独立，可并行（均依赖阶段 0）。阶段 4/5 依赖阶段 1（需要 schema 基础）。阶段 6 收尾。
