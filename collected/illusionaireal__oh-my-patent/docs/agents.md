# 智能体、技能与协作

[文档中心](./README.md) · [English](./agents-en.md)

清单依据 [plugin.jsonc](../plugin.jsonc)：14 个智能体、6 项技能、9 个命令。
表中使用实际注册 ID，可以点击查看对应定义。

## 智能体

| 注册 ID | 职责 |
|---|---|
| [`archimedes`](../src/agents/archimedes.md) | 编排全流程并传递项目上下文 |
| [`patent-innovation-architect`](../src/agents/patent-innovation-architect.md) | 使用 TRIZ 方法生成候选构思 |
| [`patent-landscape-analyst`](../src/agents/patent-landscape-analyst.md) | 聚合现有技术证据与技术全景 |
| [`patentability-evaluator`](../src/agents/patentability-evaluator.md) | 评估新颖性、创造性与实用性 |
| [`patent-brainstorm-moderator`](../src/agents/patent-brainstorm-moderator.md) | 协调辩论、汇总评分与决策 |
| [`patent-path-recorder`](../src/agents/patent-path-recorder.md) | 保存轮次、创新点快照与决策路径 |
| [`patent-security-engineer`](../src/agents/patent-security-engineer.md) | 检查安全漏洞与侧信道风险 |
| [`patent-product-compliance-analyst`](../src/agents/patent-product-compliance-analyst.md) | 评估法规与隐私合规问题 |
| [`patent-disclosure-writer`](../src/agents/patent-disclosure-writer.md) | 撰写与更新 MAIN.md 交底书 |
| [`patent-technical-responder`](../src/agents/patent-technical-responder.md) | 答复审查问题并提出技术修订 |
| [`patent-disclosure-reviewer`](../src/agents/patent-disclosure-reviewer.md) | 检查撰写质量与法律口径一致性 |
| [`patent-adversarial-examiner`](../src/agents/patent-adversarial-examiner.md) | 从审查员视角质疑方案 |
| [`patent-diagram-generator`](../src/agents/patent-diagram-generator.md) | 准备 Mermaid/PlantUML 附图并组织渲染 |
| [`patent-init-sentinel`](../src/agents/patent-init-sentinel.md) | 检查运行时、工具、MCP 配置与项目就绪情况 |

## 技能

| 技能 ID | 用途 |
|---|---|
| [`prior-art-search`](../src/skills/prior-art-search/SKILL.md) | 现有技术检索流程 |
| [`evidence-card`](../src/skills/evidence-card/SKILL.md) | 结构化证据记录 |
| [`jurisdiction`](../src/skills/jurisdiction/SKILL.md) | 法域规则 |
| [`disclosure-template`](../src/skills/disclosure-template/SKILL.md) | 交底书结构 |
| [`quality-gate`](../src/skills/quality-gate/SKILL.md) | 完成条件检查 |
| [`brainstorm-path`](../src/skills/brainstorm-path/SKILL.md) | 决策路径记录与恢复 |

法域配置支持 `CN`、`US`、`PCT`，默认值为 `CN`。

## 命令

这些是宿主中的命令入口；在终端操作请使用[CLI 参考](./usage.md)。

| 命令 | 用途 |
|---|---|
| [`/archimedes`](../src/commands/archimedes.md) | 启动主编排器 |
| [`/patent-new`](../src/commands/patent-new.md) | 新建专利项目 |
| [`/patent-search`](../src/commands/patent-search.md) | 进行现有技术检索 |
| [`/patent-draft`](../src/commands/patent-draft.md) | 撰写交底书 |
| [`/patent-review`](../src/commands/patent-review.md) | 审查交底书 |
| [`/patent-status`](../src/commands/patent-status.md) | 查看项目状态 |
| [`/brainstorm-resume`](../src/commands/brainstorm-resume.md) | 查看或恢复决策路径与创新点 |
| [`/patent-diagram`](../src/commands/patent-diagram.md) | 生成、重渲染或查看附图 |
| [`/patent-check`](../src/commands/patent-check.md) | 检查环境就绪情况 |

## 五种协作模式

### 1. 主编排

Archimedes 接收选题、组织项目上下文并安排专业智能体任务。
环境哨兵负责启动前检查，相关产出保存在当前项目中。
宿主提供实际调用能力，适配器生成宿主使用的定义与指令。

### 2. 对抗式头脑风暴

创新架构师生成候选方案，对抗审查员从审查与无效视角提出质疑；
主持人整理依据、追问和评分，路径记录员保存轮次。
保留争议与淘汰理由，便于之后重新评估。

### 3. 并行多维评估

安全工程师、产品合规分析师和可专利性评估者从不同角度评估候选方案。
宿主支持时可并行调用，再由主持人汇总结果。
运行时阈值读取已保存的创新点评分；具体判断见[工作流说明](./workflow-diagram.md#评分决策)。

### 4. 审查与技术答复

审查者提出问题，技术答复者逐项回应并给出 `MAIN.md` 的修改位置。
对抗审查员和安全工程师补充各自领域的问题。
Archimedes 指令要求连续两轮没有新增问题后进入最终润色；
这个编排要求与状态机允许的转换是两个层面，状态机本身不统计 QA 问题。

### 5. 决策记录与恢复

每轮结束时，路径记录员保存智能体产出引用、创新点、评分与决策。
可以查询某一轮、从节点分叉，或恢复已记录的创新点。
这些操作以已经保存的材料为基础，不会重建未保存的对话。

见[项目文件说明](./architecture.md#项目文件)和[路径命令](./usage.md#决策路径)。
