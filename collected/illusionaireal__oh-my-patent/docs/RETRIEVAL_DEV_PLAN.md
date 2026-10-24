# 文献检索模块开发计划

> 范围：oh-my-patent 文献检索（RESEARCH 阶段 + prior-art-search）。基于 2026-07-14 现状分析制定。
> 状态：待 review。标注 `[决策]` 的条目需你拍板。

## 背景与目标

**现状**：检索是"编排有骨架、检索没血肉"。CLI/TS 层只做 intent 路由 + 状态机，真正的检索动作全押在 AI agent prompt + 用户自配的外部 MCP 上，TS 层一行检索实现都没有。存在 5 个缺口（悬空依赖、零实现零测试、SEARCH 不抽 query、文件名三处不统一、MCP 未配即落空）。

**目标**：把检索推进到——**可测、可兜底、命名统一、query 自动提取、MCP 配置可感知**。不改变"CLI 不跑 agent"的项目哲学（阶段 3 除外，需单独决策）。

## 设计原则

- 不破坏现有约定：ESM `.js` 导入、原子写入（temp+rename）、安全卸载（manifest 精确删除）。
- 小步快跑：每阶段独立可交付、可测、可回滚。
- 代码与文档同步：README/CLAUDE.md/skill 文档与代码冲突时，改代码同时修文档。
- 测试镜像源码结构：`tests/unit/core/x.test.ts` ↔ `src/core/x.ts`。

---

## 阶段 0 — 快速止血（P0，零行为风险）

目标：消除悬空引用和不一致，不改运行时行为。

### 0.1 统一 landscape 文件名约定 `[决策]`
- 现状三处不一致：`references/landscape.md`（README/CLAUDE.md）、`landscape_{topic_slug}.md`（skill/agent）、`landscape_round{r}_patent-landscape-analyst.md`（archimedes.md）。
- 建议方案：**主文件统一为 `references/landscape_{topic_slug}.md`**；多轮检索用 `references/landscape_round{r}.md`（去掉冗长的 agent 后缀）。`landscape.md` 仅作 INIT 阶段占位/别名说明。
- 改动点：`src/agents/archimedes.md`、`src/agents/patent-landscape-analyst.md`、`src/skills/prior-art-search/SKILL.md`、`src/commands/patent-search.md`、`README.md`、`CLAUDE.md`。
- 验收：全局 `grep -rn "landscape" src/ docs/ README*.md` 只剩统一命名 + 别名说明。

### 0.2 SEARCH intent 提取 query
- 现状：`src/core/router.ts` 识别 SEARCH 意图但 `extracted.query` 字段空置。
- 改动：`classifyIntent` 的 SEARCH 分支补 query 提取正则（抓"检索/搜索/查找"之后的目标词）。
- 测试：`tests/unit/router.test.ts` 加用例——`classifyIntent("检索区块链支付相关专利")` 返回 `extracted.query` 含"区块链支付"。
- 验收：新测试通过，`npm run lint` 零错误。

### 0.3 处理悬空 spec 依赖 `[决策]`
- 现状：`src/agents/patent-landscape-analyst.md` 引用 `.sisyphus/retrieval_agent_spec.md`，全仓库 Glob 确认不存在。
- 两个方向：
  - **A. 删引用**：从 agent prompt 移除该行，把必要契约内联到 agent / prior-art-search SKILL.md。
  - **B. 补 spec**：新建 `.sisyphus/retrieval_agent_spec.md`，定义检索 agent 的输入/输出契约（推测 .sisyphus 是历史遗留的 spec 目录）。
- 倾向 A（最小改动，避免引入来源不明的目录约定），但你定。
- 验收：agent prompt 不再引用不存在的文件；`grep -rn "sisyphus" src/` 无悬空引用。

---

## 阶段 1 — 输出契约可测化（P1）

目标：即使检索在 AI 层执行，落盘产物也能被校验，避免格式漂移。

### 1.1 定义 landscape 输出 schema
- 新增 `src/core/landscape-schema.ts`：类型定义 + `parseLandscape(md)` + `validateLandscape(parsed)`。
- 字段：检索日期、关键词、时间范围、数据源、分类条目（专利/论文/标准）、`[R#]` 引用表、统计。
- 验收：给一份合法 landscape.md 能 parse+校验通过；缺字段的样本校验失败并报具体错误。

### 1.2 schema 测试
- `tests/unit/core/landscape-schema.test.ts`：合法样本 + 多种非法样本（缺引用表、字段类型错、`[R#]` 编号断号）。
- 验收：测试通过，镜像源码结构约定。

### 1.3 evidence-card 格式校验
- 复用 `src/skills/evidence-card/SKILL.md` 的字段约定，加 `validateEvidenceCard(md)`。
- 验收：单篇证据卡可校验。

---

## 阶段 2 — MCP 配置可感知（P1）

目标：用户不用瞎配，工具能检测和引导。

### 2.1 MCP 配置检测
- 在 `adapt setup` 末尾或新增检测子命令，读 `.claude/settings.json` 检查 `google_scholar` / `uspto_patent` / `semantic_scholar` 三个 MCP 是否配置。
- 缺失则输出提示（不阻塞），告知对应 MCP 的安装/配置方式。
- 验收：检测命令返回每个 MCP 在/不在状态 + 配置指引。

### 2.2 配置文档对齐
- `prior-art-search/SKILL.md` 里的 MCP 配置示例与实际要求一致；补充每个 MCP 的来源（是否需 key、是否官方）。
- 验收：照文档配能跑通（手动验证或文档自洽性检查）。

---

## 阶段 3 — TS 层检索聚合器（P2，可选，需单独决策） `[决策]`

> ⚠️ 此阶段改变架构：检索从纯 AI 层下沉到 TS 层，与项目"CLI 不跑 agent、只管状态/决策路径/绘图/适配器"的定位有张力。**需你明确是否走这条路。**

### 3.1 检索聚合器抽象
- 新增 `src/core/retrieval-aggregator.ts`：定义 `SourceAdapter` 接口，封装 MCP 调用 → 归一化 → 去重 → 评分。
- 先骨架 + mock 源，不强制实现所有真实源。
- 验收：单元测试用 mock 源跑通聚合/去重/评分。

### 3.2 缓存 + 重试
- 同 session 缓存（避免重复检索）、指数退避重试。
- 验收：测试覆盖缓存命中 + 重试场景。

### 3.3 接入 agent
- archimedes / landscape-analyst 改为调用聚合器而非裸 MCP（agent prompt 调整 + TS 侧提供能力）。
- 验收：集成测试覆盖端到端（mock MCP）。

---

## 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 阶段 3 与项目哲学冲突 | 架构方向偏移 | 单独决策，默认不做 |
| MCP 源不稳定/需 key | 测试难复现 | 全程 mock，真实源手动验证 |
| 文件名统一破坏已有项目 references/ | 数据迁移 | 提供迁移说明，旧名保留为别名一段时间 |
| .sisyphus 来源不明 | 补错 spec | 倾向删引用而非猜 spec |

## 决策点（需你拍板）

1. **landscape 文件名**：主文件用 `landscape_{topic_slug}.md` + 多轮 `landscape_round{r}.md`？OK？
2. **.sisyphus spec**：删引用（A）还是补 spec（B）？
3. **阶段 3（TS 层聚合器）**：做不做？这关系到检索是否从 AI 层下沉到代码层。
4. **执行模式**：计划确认后，要我开始执行阶段 0（最快见效），还是你先逐条 review？

## 建议执行顺序

```
阶段 0（止血，~小改动）→ 阶段 1（可测契约）→ 阶段 2（MCP 感知）→ [决策] 阶段 3
```

阶段 0 三项互相独立，可并行；阶段 1 依赖 0.1（文件名统一后 schema 才好定）；阶段 2 独立；阶段 3 看决策。
