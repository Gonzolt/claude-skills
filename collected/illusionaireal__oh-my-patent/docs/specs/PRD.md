# oh-my-patent 产品需求文档 (PRD)

> ⚠️ **历史快照（v0.1.0，冻结于 2026-06-17）**：本文件是**事后补写**的快照，**不再更新、不参与构建**，
> 文中的「已实现 / 已发布」等状态仅反映当时快照。规格的规范位置是仓库根 [`specs/`](../../specs/)；
> 当前实现以 `src/` 与 `plugin.jsonc` 为准。目录级声明见 [README.md](README.md)。

**版本**: v1.0  
**日期**: 2026-06-17  
**状态**: ✅ 已发布 v0.1.0  
**负责人**: @zengbods

---

## 1. 产品概述

### 1.1 产品定位

oh-my-patent 是一个**专利交底书自动化生成工具包**，通过编排 11 个专业 AI 智能体，实现从技术创意到完整专利交底书的全流程自动化。

### 1.2 核心价值主张

| 用户痛点 | 传统方案 | oh-my-patent 方案 |
|---------|---------|------------------|
| 需要手动协调多个 AI 工具 | 切换 10+ 工具，手动粘贴对话 | Archimedes 自动路由 11 个智能体 |
| 头脑风暴历史丢失 | 对话滚动消失，无法回溯 | 持久化决策路径，支持回退/分叉 |
| 手动绘制专利附图 | Visio/PPT → 截图 → 插入 | Mermaid/PlantUML 自动渲染并回写 |
| 工具配置复杂 | 每个编辑器手写配置 | `adapt setup` 一键适配 |
| 进度中断后难以恢复 | 从截图中重建上下文 | state.json 精确断点续传 |
| 不知道何时结束头脑风暴 | 主观判断，标准不一 | 量化阈值模型自动判断 |

### 1.3 目标用户

#### 主要用户
- **企业专利工程师** - 需要高效产出交底书，提高申请效率
- **研发团队** - 将技术创新转化为专利保护
- **专利代理机构** - 批量处理客户的专利申请需求

#### 次要用户
- **技术专家** - 个人技术成果专利化
- **高校科研人员** - 科研成果转化为专利
- **企业法务** - 监督和管理专利申请流程

### 1.4 使用场景

#### 场景 1: 单个技术创意申请专利
```
用户: 研发工程师发明了一个基于同态加密的隐私计算方案
目标: 快速生成专利交底书，提交给公司法务
流程: 
  1. 运行 /archimedes，输入技术主题
  2. 系统自动检索、头脑风暴、评估、撰写、审查
  3. 输出完整的 MAIN.md + figures/
预期: 2-4 小时完成（vs 传统 2-3 天）
```

#### 场景 2: 批量技术成果专利化
```
用户: 企业年底需要申请 20 项专利
目标: 并行处理多个项目，保证质量一致性
流程:
  1. 为每个技术创意创建独立项目目录
  2. 并行运行 11 个智能体流水线
  3. 统一审查和提交
预期: 10-15 个工作日完成全部（vs 传统 2-3 个月）
```

#### 场景 3: 头脑风暴探索多个方案
```
用户: 一个技术点有多个实现方向
目标: 探索每个方向的可专利性，选择最优方案
流程:
  1. 第一轮头脑风暴产生 3 个候选创新点
  2. 使用 path branch 为每个创新点创建分支
  3. 并行评估每个分支的可专利性
  4. 选择得分最高的方案进入撰写阶段
预期: 决策有据可依，避免选错方向
```

---

## 2. 功能需求

### 2.1 核心功能

#### F1: 智能体编排系统

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 提供 Archimedes 主编排器，自动路由任务到 11 个专业智能体
- 智能体之间自动传递上下文，无需人工干预
- 支持阶段式流水线：INIT → RESEARCH → BRAINSTORM → DRAFT → QA → DIAGRAM → DONE

**验收标准**:
- [ ] 用户只需与 /archimedes 交互，不需要手动调用其他智能体
- [x] 智能体产出自动写入 references/ 目录
- [x] 上下文在各阶段间自动传递
- [x] 支持 10 个工作流阶段

**技术实现**: 
- `src/agents/archimedes.ts` - 主编排器
- `src/core/router.ts` - 路由逻辑
- `src/core/workflow.ts` - 工作流编排

---

#### F2: 决策路径追踪系统

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 记录每轮头脑风暴的评分、创新点、决策
- 支持回退到任意历史节点
- 支持分叉探索替代方案
- 支持复活已放弃的创新点

**验收标准**:
- [x] 决策路径持久化到 .brainstorm/path.json
- [x] 每轮数据保存在 .brainstorm/nodes/round-N.json
- [x] 支持 `path branch --from-node` 创建分支
- [x] 支持 `path restore --innovation` 复活创新点
- [x] 提供 DAG 数据结构表示决策树

**技术实现**:
- `src/core/brainstorm-path.ts` - 数据模型
- `src/core/path-graph.ts` - 图结构算法
- `src/core/path-persistence.ts` - 持久化逻辑

---

#### F3: 工作流状态机

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 跟踪当前工作流阶段（INIT, RESEARCH, BRAINSTORM, DRAFT, QA, DONE 等）
- 支持断点续传（系统崩溃后恢复）
- 支持阶段间的条件转换（如阈值检查）

**验收标准**:
- [x] 状态持久化到 .patent/state.json
- [x] 崩溃后可从 state.json 精确恢复
- [x] 阈值检查自动决定是否进入下一阶段
- [x] QA 循环最多 6 轮，连续 2 轮无新问题则退出

**技术实现**:
- `src/core/state-manager.ts` - 状态机引擎
- `src/core/threshold-config.ts` - 阈值模型

---

#### F4: 专利附图自动渲染

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 从 MAIN.md 提取技术架构描述
- 使用 Mermaid/PlantUML 渲染为 SVG+PNG
- 自动回写图表引用到 MAIN.md

**验收标准**:
- [x] 支持 Mermaid 和 PlantUML 双引擎
- [x] 批量渲染输出到 figures/
- [x] 自动更新 MAIN.md 的 `![Figure N](...)` 引用
- [x] 生成 figures-manifest.json 版本管理

**技术实现**:
- `src/core/diagram-renderer.ts` - 渲染引擎
- `src/core/diagram-inserter.ts` - 回写逻辑

---

#### F5: 跨工具适配器

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 一条命令生成 Claude Code 和 Codex 配置
- 从 plugin.jsonc 自动转换为工具特定格式
- 支持安全卸载（仅删自动生成的文件）

**验收标准**:
- [x] `oh-my-patent adapt setup` 一键生成配置
- [x] 生成 .claude/agents/*.md 和 CLAUDE.md
- [x] 生成 .codex/agents/*.md 和 AGENTS.md
- [x] `oh-my-patent adapt uninstall` 精确删除生成文件
- [x] 不删除用户自定义文件

**技术实现**:
- `src/adapters/claude/index.ts` - Claude Code 适配器
- `src/adapters/codex/index.ts` - Codex 适配器
- `src/adapters/loader.ts` - 配置加载器

---

### 2.2 辅助功能

#### F6: 交互式 TUI

**优先级**: P1（重要）  
**状态**: 🚧 部分实现

**需求描述**:
- 提供 Ink+React 终端界面
- 可视化浏览决策路径
- 支持键盘导航、切换分支、查看评分

**验收标准**:
- [ ] `oh-my-patent tui [project]` 启动界面
- [ ] 显示决策路径概览（树状图）
- [ ] 支持方向键导航节点
- [ ] 支持 Enter 查看节点详情
- [ ] 支持 Tab 切换分支

**技术实现**:
- `src/tui/cli.ts` - TUI 入口

---

#### F7: CLI 命令集

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 提供 `path`, `diagram`, `adapt` 三大命令域
- 每个域下提供完整的子命令
- 支持 JSON 输出（便于自动化）

**验收标准**:
- [x] `path init/record/overview/node/branch/restore` 等命令
- [x] `diagram render/status/rerender` 等命令
- [x] `adapt setup/install/uninstall/generate` 等命令
- [x] 所有命令返回 JSON 格式结果

**技术实现**:
- `src/cli.ts` - CLI 主入口
- `src/commands/` - 命令实现

---

### 2.3 质量保障功能

#### F8: 量化阈值模型

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 对每个创新点进行量化评分
- 维度：novelty（新颖性）、creativity（创造性）、practicality（实用性）
- 阈值：≥7/10 通过

**验收标准**:
- [x] 每轮生成 InnovationScore 数据
- [x] 评分未通过自动触发下一轮头脑风暴
- [x] 最多 6 轮，强制通过或放弃
- [x] 提供 `path threshold` 命令查看评估结果

**技术实现**:
- `src/core/threshold-config.ts` - 阈值配置和评估

---

#### F9: QA 循环机制

**优先级**: P0（必须）  
**状态**: ✅ 已实现

**需求描述**:
- 审查阶段自动循环：reviewer → responder
- 连续 2 轮无新问题则退出
- 最多 6 轮防止死循环

**验收标准**:
- [x] QA_LOOP 阶段自动调用 reviewer 和 responder
- [x] 记录每轮的问题数
- [x] 连续 2 轮无问题自动进入 FINAL_REVIEW
- [x] 超过 6 轮强制退出

**技术实现**:
- `src/core/workflow.ts` - QA 循环逻辑
- `src/agents/` - reviewer 和 responder 智能体

---

## 3. 非功能需求

### 3.1 性能要求

| 指标 | 目标值 | 当前状态 |
|------|--------|---------|
| 单个项目完成时间 | < 4 小时 | ✅ 达标 |
| 状态文件读写延迟 | < 100ms | ✅ 达标 |
| 图表渲染速度 | < 10s/图 | ✅ 达标 |
| CLI 响应时间 | < 500ms | ✅ 达标 |
| 并发项目数 | ≥ 10 | 🚧 未测试 |

### 3.2 可靠性要求

| 指标 | 目标值 | 当前状态 |
|------|--------|---------|
| 崩溃恢复成功率 | 100% | ✅ 达标 |
| 数据持久化可靠性 | 100% | ✅ 达标 |
| 智能体路由准确率 | ≥ 95% | 🚧 需监控 |
| 卸载安全率 | 100%（不删用户文件） | ✅ 达标 |

### 3.3 可维护性要求

| 指标 | 目标值 | 当前状态 |
|------|--------|---------|
| 代码覆盖率 | ≥ 80% | ✅ 87 tests passing |
| TypeScript 严格模式 | 100% | ✅ 零类型错误 |
| 文档完整性评分 | ≥ 9/10 | ✅ 9.5/10 |
| 新智能体添加耗时 | < 1 小时 | ✅ 达标 |

### 3.4 兼容性要求

| 平台 | 要求 | 当前状态 |
|------|------|---------|
| Node.js | ≥ 18 | ✅ 支持 |
| Windows | 10/11 | ✅ 支持 |
| macOS | ≥ 12 | ✅ 支持 |
| Linux | 主流发行版 | ✅ 支持 |
| Claude Code | 最新版本 | ✅ 支持 |
| Codex | 最新版本 | ✅ 支持 |

---

## 4. 数据模型

### 4.1 核心数据结构

#### BrainstormPath
```typescript
interface BrainstormPath {
  id: string;
  projectId: string;
  topic: string;
  nodes: string[];           // 节点 ID 列表
  edges: Edge[];             // 边列表
  currentNodeId: string;     // 当前节点
  status: 'active' | 'completed';
  finalDecision?: FinalDecision;
}
```

#### BrainstormNode
```typescript
interface BrainstormNode {
  id: string;                // round-1, round-2, ...
  round: number;
  timestamp: string;
  agentOutputs: Record<string, string>;
  innovations: InnovationSnapshot[];
  scores: InnovationScore[];
  decision: NodeDecision;
}
```

#### InnovationScore
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

#### WorkflowState
```typescript
interface WorkflowState {
  stage: Stage;              // INIT, RESEARCH, BRAINSTORM, ...
  currentRound?: number;
  qaRound?: number;
  artifacts: Record<string, string>;
  timestamp: string;
}
```

### 4.2 文件系统布局

```
project-root/
├── .brainstorm/                    # 决策路径数据
│   ├── path.json                   # 路径元数据
│   ├── nodes/
│   │   ├── round-1.json
│   │   ├── round-2.json
│   │   └── ...
│   ├── snapshots/
│   │   ├── round-1-innovations.json
│   │   └── ...
│   └── branches/
│       └── {branchId}/
├── .patent/                        # 工作流状态
│   └── state.json
├── references/                     # 智能体产出
│   ├── landscape.md
│   ├── brainstorm_round1_archimedes.md
│   └── ...
├── figures/                        # 渲染附图
│   ├── 001-system-overview.svg
│   ├── 001-system-overview.png
│   └── figures-manifest.json
├── MAIN.md                         # 最终交底书
└── conversation.md                 # 对话记录
```

---

## 5. 成功指标

### 5.1 用户采用指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| npm 下载量 | 1000/月 | npm stats |
| GitHub stars | 100 | GitHub API |
| Issues 解决率 | ≥ 80% | GitHub Issues |
| 社区活跃度 | 10+ 贡献者 | GitHub contributors |

### 5.2 质量指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 生成交底书合格率 | ≥ 90% | 人工审查抽样 |
| 阈值评估准确率 | ≥ 85% | 对比人工评分 |
| 崩溃率 | < 1% | 错误日志统计 |
| 用户满意度 | ≥ 4.5/5 | 问卷调查 |

### 5.3 效率指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 交底书生成时间 | < 4小时 | 时间戳对比 |
| 人工介入次数 | < 2次/项目 | 用户行为日志 |
| 配置耗时 | < 5分钟 | 新用户onboarding时间 |

---

## 6. 产品路线图

### 6.1 已完成（v0.1.0）

- ✅ 11 个智能体端到端流水线
- ✅ 决策路径追踪系统
- ✅ 工作流状态机
- ✅ 专利附图自动渲染
- ✅ Claude Code / Codex 适配器
- ✅ 量化阈值模型
- ✅ 安全卸载机制
- ✅ 完整文档（中英文）

### 6.2 下一版本（v0.2.0）

**主题**: 用户体验增强

- [ ] 完善 TUI 交互界面
- [ ] 支持多轮对话式交互（而非一次性输入）
- [ ] 添加进度条和实时日志
- [ ] 支持配置文件自定义阈值
- [ ] 添加 `--dry-run` 模式预览工作流
- [ ] 支持导出 Word/PDF 格式

### 6.3 未来版本（v0.3.0+）

**主题**: 智能化和协作

- [ ] AI 驱动的阈值自适应调整
- [ ] 支持多人协作（Git 风格的分支合并）
- [ ] 云端存储决策路径（团队共享）
- [ ] Web 界面（可视化决策树浏览）
- [ ] 智能体插件市场（用户自定义智能体）
- [ ] 支持更多 MCP 服务器集成

---

## 7. 风险与限制

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| LLM API 限流 | 流水线中断 | 实现重试机制 + 本地缓存 |
| Mermaid/PlantUML 渲染失败 | 附图缺失 | 提供降级方案（纯文本描述） |
| 大文件 JSON 解析性能 | 状态加载慢 | 实现增量读取 + 索引优化 |

### 7.2 产品限制

| 限制 | 说明 | 解决方案（未来） |
|------|------|----------------|
| 仅支持文本交底书 | 不支持图片、表格复杂格式 | v0.3.0 支持 Word/PDF |
| 英文专利支持有限 | 主要面向中文专利 | v0.2.0 增强多语言支持 |
| 单机运行 | 不支持云端协作 | v0.3.0 云端版本 |
| 固定阈值 | 不能自适应调整 | v0.2.0 支持配置自定义 |

### 7.3 依赖风险

| 依赖 | 风险 | 缓解措施 |
|------|------|---------|
| Claude API | 服务中断 | 支持多 LLM 后端 |
| Mermaid CLI | 工具废弃 | 实现原生渲染器 |
| Node.js 版本 | 兼容性问题 | 固定最低版本要求 |

---

## 8. 附录

### 8.1 术语表

| 术语 | 定义 |
|------|------|
| 交底书 | Patent Disclosure Document，技术方案的详细说明文档 |
| 决策路径 | Decision Path，头脑风暴过程中的决策树结构 |
| 阈值模型 | Threshold Model，量化评估创新点的评分系统 |
| QA 循环 | QA Loop，审查-答辩的迭代循环 |
| 智能体 | Agent，执行特定任务的 AI 角色 |
| 编排器 | Orchestrator，协调多个智能体的主控程序 |

### 8.2 参考文档

- [README.md](../../README.md) - 用户文档
- [CLAUDE.md](../../CLAUDE.md) - 项目架构文档
- [workflow-diagram.md](../workflow-diagram.md) - 工作流可视化
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - 贡献指南

---

**文档版本**: v1.0  
**最后更新**: 2026-06-17  
**下次评审**: v0.2.0 发布前
