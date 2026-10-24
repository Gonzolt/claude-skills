# AI Image Generation Prompts for oh-my-patent Architecture Diagrams

这些提示词用于生成 oh-my-patent 项目的架构图。建议使用 Midjourney, DALL-E 3, 或 Stable Diffusion XL 等 AI 绘图工具。

## 通用风格指南

**整体风格**：
- 现代扁平化设计（Flat design）
- 温暖的配色方案：奶油白 #F7F4EF 背景，陶土色 #C4612F 作为强调色
- 清晰的图标和流程箭头
- 专业的技术文档风格，类似于 AWS 或 Google Cloud 架构图
- 避免过于卡通化，保持专业性

**配色参考**：
- 背景：温暖奶油白 #F7F4EF
- 主要元素：深色 #1F2421
- 强调色：陶土色 #C4612F（用于重要节点和箭头）
- 次要文字：柔和灰 #5C635D
- 辅助背景：纯白 #FFFFFF 和浅奶油 #FBF9F5

---

## 图 1：Orchestration Routing (编排路由)

### 文件名
`01-orchestration.png` / `01-orchestration.svg`

### 核心概念
展示 Archimedes 作为中央调度器，如何根据状态机在11个专业代理之间进行路由。

### AI 提示词（中文）

```
绘制一个现代的软件架构图，风格类似AWS架构图：

中央核心：一个大型的陶土色六边形节点，标注"Archimedes 主编排器"，带有齿轮和路由图标

左侧：一个温暖奶油色的矩形框，内部显示"state.json 状态机"，包含10个小的阶段卡片垂直排列：
INIT → RESEARCH → BRAINSTORM_R1 → BRAINSTORM_R2 → DRAFT → DIAGRAM_DRAFT → QA_LOOP → FINAL_REVIEW → DIAGRAM_FINAL → DONE

右侧：11个专业代理以圆角矩形卡片形式排列成3列，每个卡片包含：
- 小图标（根据功能：搜索、灯泡、盾牌、法律天平、评分、笔等）
- 代理名称（如"landscape-analyst"、"innovation-architect"等）
- 用柔和灰色文字注明触发阶段

中央的Archimedes向左右发出多条箭头：
- 向左的箭头（深色）：读取状态
- 向右的箭头（陶土色）：分发任务到对应代理
- 回流箭头：代理完成后更新状态

底部：三个小的存储图标，标注：
- ".patent/state.json"（工作流状态）
- ".brainstorm/path.json"（决策路径）
- "references/"（代理输出）

顶部显示一个阈值检查门，用虚线框标注关键阈值：
"passToDraft ≥ 8.5"
"novelty ≥ 6.0, creativity ≥ 6.0"

整体背景为温暖奶油白 #F7F4EF，使用温暖色调和现代扁平化设计，清晰的箭头流向，专业的技术文档风格
```

### AI Prompt (English)

```
Create a modern software architecture diagram in AWS architecture style:

Center: A large terracotta hexagonal node labeled "Archimedes Orchestrator" with gear and routing icons

Left side: A warm cream-colored rectangle box showing "state.json State Machine" with 10 small stage cards vertically arranged:
INIT → RESEARCH → BRAINSTORM_R1 → BRAINSTORM_R2 → DRAFT → DIAGRAM_DRAFT → QA_LOOP → FINAL_REVIEW → DIAGRAM_FINAL → DONE

Right side: 11 specialist agents as rounded rectangle cards in 3 columns, each containing:
- Small icon (based on function: search, lightbulb, shield, scales, score, pen, etc.)
- Agent name (e.g., "landscape-analyst", "innovation-architect", etc.)
- Trigger stage noted in muted gray text

Arrows from Archimedes:
- Left arrows (dark): Read state
- Right arrows (terracotta): Dispatch tasks to agents
- Return arrows: Agents update state after completion

Bottom: Three small storage icons labeled:
- ".patent/state.json" (workflow state)
- ".brainstorm/path.json" (decision path)
- "references/" (agent outputs)

Top: A threshold gate with dashed box showing key thresholds:
"passToDraft ≥ 8.5"
"novelty ≥ 6.0, creativity ≥ 6.0"

Overall background: warm cream #F7F4EF, warm color scheme, modern flat design, clear arrow flows, professional technical documentation style
```

---

## 图 2：Adversarial Brainstorming (对抗性头脑风暴)

### 文件名
`02-adversarial.png` / `02-adversarial.svg`

### 核心概念
R1 阶段的头对头辩论：创新架构师生成候选方案，对抗性审查员攻击它们，裁判评分。

### AI 提示词（中文）

```
绘制一个动态的对抗流程图，类似于辩论或比赛场景：

左侧：蓝色圆角卡片"Innovation Architect"，带有灯泡图标，向右发射多个创意箭头，每个箭头上标注"候选方案 #1", "#2", "#3"

中央：一个六边形的竞技场区域，标注"R1 对抗辩论"，背景使用半透明的陶土色

右侧：红色圆角卡片"Adversarial Examiner"，带有盾牌和交叉图标，向左发射对抗箭头，箭头上标注"新颖性质疑"、"显而易见性攻击"、"现有技术"

顶部：黄色圆角卡片"Brainstorm Moderator"，带有天平图标，从中央竞技场接收信息，标注"仲裁 & 评分"

底部：绿色存储图标"Path Recorder"，接收裁判的结果，标注"快照 → .brainstorm/nodes/round-1.json"

在竞技场内显示评分过程：
- 多个创意气泡在竞技场内碰撞
- 一些气泡带有绿色勾号（ACCEPT）
- 一些气泡带有黄色循环箭头（ITERATE）
- 一些气泡带有红色叉号（REJECT）

右下角：小的文件图标显示输出："references/brainstorm_round1_*.md"

使用温暖奶油白背景，动态的箭头流动效果，对抗的能量感，但保持专业的技术文档风格
```

### AI Prompt (English)

```
Create a dynamic adversarial flow diagram, similar to a debate or competition scene:

Left: Blue rounded card "Innovation Architect" with lightbulb icon, shooting multiple idea arrows to the right, each labeled "Candidate #1", "#2", "#3"

Center: A hexagonal arena area labeled "R1 Adversarial Debate", background using semi-transparent terracotta

Right: Red rounded card "Adversarial Examiner" with shield and cross icon, firing counter-arrows to the left, labeled "Novelty Challenge", "Obviousness Attack", "Prior Art"

Top: Yellow rounded card "Brainstorm Moderator" with scales icon, receiving from the arena, labeled "Arbitrate & Score"

Bottom: Green storage icon "Path Recorder", receiving results from moderator, labeled "Snapshot → .brainstorm/nodes/round-1.json"

Inside arena show scoring process:
- Multiple idea bubbles colliding in the arena
- Some bubbles with green checkmarks (ACCEPT)
- Some bubbles with yellow circular arrows (ITERATE)
- Some bubbles with red X marks (REJECT)

Bottom right: Small file icon showing outputs: "references/brainstorm_round1_*.md"

Use warm cream background, dynamic arrow flow effects, sense of adversarial energy, maintaining professional technical documentation style
```

---

## 图 3：Parallel Multi-Dimensional Evaluation (并行多维度评估)

### 文件名
`03-parallel-eval.png` / `03-parallel-eval.svg`

### 核心概念
R2 阶段的扇出/扇入模式：Archimedes 将幸存的创新方案同时分发给三个评估器，每个评估不同维度。

### AI 提示词（中文）

```
绘制一个扇出-扇入的并行处理架构图：

顶部中央：陶土色节点"Archimedes"，从它向下扇出三条粗箭头

中间层：三个并排的评估器卡片，每个卡片有独特的颜色和图标：
1. 左侧：蓝色"Security Engineer"，带有盾牌图标，标注"S_sec - 安全漏洞 & 侧信道"
2. 中间：绿色"Compliance Analyst"，带有法律文件图标，标注"S_comp - 法规 & 隐私"
3. 右侧：紫色"Patentability Evaluator"，带有星星图标，标注"S_pat - 新颖性 & 创造性 & 实用性"

每个评估器向下发出一条带有分数的箭头（如"7.5", "8.2", "9.0"）

底部中央：黄色聚合节点"Brainstorm Moderator"，接收三条箭头，内部显示加权公式：
"S = 0.3·S_sec + 0.3·S_comp + 0.4·S_pat"

最底部：决策门，显示两个条件：
✓ 如果 S ≥ 8.5 且所有维度 ≥ 6.0 → 绿色箭头指向"进入 DRAFT"
✗ 否则 → 红色箭头指向"返回 BRAINSTORM_R1"

背景使用分层的浅色区域来区分不同阶段：扇出区、评估区、聚合区、决策区

整体使用温暖奶油白背景，清晰的并行流向，现代扁平化设计
```

### AI Prompt (English)

```
Create a fan-out/fan-in parallel processing architecture diagram:

Top center: Terracotta node "Archimedes", fanning out three thick arrows downward

Middle layer: Three side-by-side evaluator cards, each with unique color and icon:
1. Left: Blue "Security Engineer" with shield icon, labeled "S_sec - Vulnerabilities & Side Channels"
2. Center: Green "Compliance Analyst" with legal document icon, labeled "S_comp - Regulatory & Privacy"
3. Right: Purple "Patentability Evaluator" with star icon, labeled "S_pat - Novelty & Creativity & Utility"

Each evaluator sends down an arrow with a score (e.g., "7.5", "8.2", "9.0")

Bottom center: Yellow aggregation node "Brainstorm Moderator", receiving three arrows, showing weighted formula inside:
"S = 0.3·S_sec + 0.3·S_comp + 0.4·S_pat"

Very bottom: Decision gate showing two conditions:
✓ If S ≥ 8.5 AND all dimensions ≥ 6.0 → Green arrow to "Proceed to DRAFT"
✗ Otherwise → Red arrow to "Return to BRAINSTORM_R1"

Background uses layered light color zones to distinguish stages: fan-out zone, evaluation zone, aggregation zone, decision zone

Overall warm cream background, clear parallel flows, modern flat design
```

---

## 图 4：QA Argue Loop (QA 辩论循环)

### 文件名
`04-qa-loop.png` / `04-qa-loop.svg`

### 核心概念
有界的审核-反驳循环：审核者提出问题，响应者修订，直到连续2轮无新问题。

### AI 提示词（中文）

```
绘制一个循环流程图，展示迭代的审核-修订过程：

左侧：一个大的陶土色文档图标"MAIN.md 草稿"

从文档向右发出箭头到审核区域

右上区域：三个审核者卡片垂直排列（小尺寸）：
1. "Disclosure Reviewer" - 法律天平图标 - "撰写 & 法律合规"
2. "Adversarial Examiner" - 盾牌图标 - "无效化角度"
3. "Security Engineer" - 锁图标 - "安全边界"

审核者向下发出多个问题气泡，每个气泡标注问题编号"Issue #1", "#2", "#3"等

右下区域：响应者卡片"Technical Responder"，带有笔记本图标，接收问题气泡，发出回复箭头标注"逐条答复 + MAIN.md 补丁"

底部：循环判断节点（菱形），显示：
"新问题？"
- 如果是：红色箭头循环回审核区域，标注"重置计数器"
- 如果否：检查"连续 2 轮无问题？"
  - 是：绿色箭头指向"FINAL_REVIEW"
  - 否：继续循环

左下角显示轮次计数器："Round 1 / 6"

在循环路径上标注最大轮次："≤ 6 轮"

整体呈现顺时针的循环流向，使用温暖奶油白背景，清晰的循环箭头，视觉上强调"bounded loop"（有界循环）的概念
```

### AI Prompt (English)

```
Create a loop flow diagram showing iterative review-revision process:

Left: A large terracotta document icon "MAIN.md Draft"

Arrow from document to review area on the right

Top right area: Three reviewer cards vertically stacked (small size):
1. "Disclosure Reviewer" - Legal scales icon - "Writing & Legal Compliance"
2. "Adversarial Examiner" - Shield icon - "Invalidation Angle"
3. "Security Engineer" - Lock icon - "Security Boundary"

Reviewers send down multiple issue bubbles, each labeled "Issue #1", "#2", "#3", etc.

Bottom right area: Responder card "Technical Responder" with notebook icon, receiving issue bubbles, sending reply arrows labeled "Issue-by-Issue Response + MAIN.md Patches"

Bottom: Loop decision node (diamond), showing:
"New Issues?"
- If yes: Red arrow loops back to review area, labeled "Reset Counter"
- If no: Check "2 Consecutive Clean Rounds?"
  - Yes: Green arrow to "FINAL_REVIEW"
  - No: Continue loop

Bottom left shows round counter: "Round 1 / 6"

On loop path annotate max rounds: "≤ 6 Rounds"

Overall presents clockwise loop flow, warm cream background, clear loop arrows, visually emphasize "bounded loop" concept
```

---

## 图 5：Decision Path DAG (决策路径有向无环图)

### 文件名
`05-path-dag.png` / `05-path-dag.svg`

### 核心概念
头脑风暴的决策路径以DAG形式存储，支持分支探索和恢复被放弃的创新点。

### AI 提示词（中文）

```
绘制一个有向无环图（DAG）的可视化，类似于Git分支图：

主路径（横向从左到右）：
- 5个大的圆形节点连成一条线，每个节点标注"Round 1", "Round 2", "Round 3", "Round 4", "Round 5"
- 节点内显示简化的创新点列表和分数（如"Innovation A: 8.5", "Innovation B: 7.2"）
- 当前节点用陶土色高亮并标注"Current"
- 最终节点用绿色高亮并标注"Final Decision"

分支路径：
- 从Round 2节点分出一条向上的分支，标注"Branch: Alternative Direction"，包含2个节点
- 从Round 3节点分出一条向下的分支，标注"Branch: Explore Security-First"，包含3个节点
- 分支用虚线表示

底部存储区域：显示文件结构图标
- ".brainstorm/path.json" - 元数据 & 边 & 当前节点
- ".brainstorm/nodes/" - 每轮详细数据
- ".brainstorm/snapshots/" - 创新点历史快照
- ".brainstorm/branches/" - 分叉探索

右侧操作面板：两个操作按钮图标
1. "path branch --from-node" - 分叉图标 - 从任意历史节点分叉
2. "path restore --innovation" - 恢复图标 - 复活被放弃的创新点

在某些节点旁边显示小的创新点气泡，用不同颜色标注状态：
- 绿色：ACCEPTED
- 黄色：ITERATE
- 红色虚线：REJECTED (但可以被恢复)
- 灰色虚线：ABANDONED

整体使用Git分支图的视觉语言，温暖奶油白背景，清晰的节点和边，现代的扁平化设计风格
```

### AI Prompt (English)

```
Create a directed acyclic graph (DAG) visualization, similar to a Git branch diagram:

Main path (horizontal from left to right):
- 5 large circular nodes in a line, each labeled "Round 1", "Round 2", "Round 3", "Round 4", "Round 5"
- Inside nodes show simplified innovation lists and scores (e.g., "Innovation A: 8.5", "Innovation B: 7.2")
- Current node highlighted in terracotta and labeled "Current"
- Final node highlighted in green and labeled "Final Decision"

Branch paths:
- From Round 2 node, branch upward labeled "Branch: Alternative Direction" with 2 nodes
- From Round 3 node, branch downward labeled "Branch: Explore Security-First" with 3 nodes
- Branches shown with dashed lines

Bottom storage area: File structure icons showing
- ".brainstorm/path.json" - metadata & edges & current node
- ".brainstorm/nodes/" - per-round details
- ".brainstorm/snapshots/" - innovation history snapshots
- ".brainstorm/branches/" - forked explorations

Right side operation panel: Two operation button icons
1. "path branch --from-node" - Fork icon - Branch from any historical node
2. "path restore --innovation" - Restore icon - Revive abandoned innovations

Near some nodes show small innovation bubbles with different colors indicating status:
- Green: ACCEPTED
- Yellow: ITERATE
- Red dashed: REJECTED (but can be restored)
- Gray dashed: ABANDONED

Overall use Git branch diagram visual language, warm cream background, clear nodes and edges, modern flat design style
```

---

## 使用建议

### 推荐 AI 工具

1. **Midjourney**（推荐）
   - 命令格式：`/imagine prompt: [上述提示词] --ar 16:9 --style raw --v 6`
   - 适合生成专业的技术文档图
   - 需要在 Discord 中使用

2. **DALL-E 3**（通过 ChatGPT Plus）
   - 直接粘贴提示词即可
   - 可以多次迭代调整细节
   - 输出格式友好

3. **Stable Diffusion XL**（开源，本地运行）
   - 需要添加技术关键词：`technical diagram, architecture diagram, clean design, professional`
   - 可以使用 ControlNet 保持结构一致性

### 后处理建议

生成图片后，建议使用以下工具进行后处理：

1. **去除背景杂点**：使用 Photoshop 或 Figma 清理
2. **添加文字标注**：AI 生成的文字可能不清晰，建议用矢量工具重新添加
3. **统一配色**：确保5张图使用一致的配色方案
4. **导出格式**：
   - PNG（用于 GitHub README）：72-144 DPI
   - SVG（用于文档）：矢量格式，可缩放

### 文件命名规范

生成后的文件应放置在：
```
docs/images/ai-gen/
├── 01-orchestration.png
├── 02-adversarial.png
├── 03-parallel-eval.png
├── 04-qa-loop.png
└── 05-path-dag.png
```

### 更新 README 引用

生成后，更新 README.md 中的图片路径：
```markdown
![Orchestration routing](docs/images/ai-gen/01-orchestration.png)
![Adversarial brainstorming](docs/images/ai-gen/02-adversarial.png)
![Parallel evaluation](docs/images/ai-gen/03-parallel-eval.png)
![QA argue loop](docs/images/ai-gen/04-qa-loop.png)
![Decision path DAG](docs/images/ai-gen/05-path-dag.png)
```

---

## 版本历史

- v1.0 (2026-07-08): 初始版本，包含5张架构图的AI生成提示词
