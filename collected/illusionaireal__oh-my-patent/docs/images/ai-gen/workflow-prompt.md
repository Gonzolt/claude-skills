# Workflow Diagram AI Generation Prompt

## 文件名
`workflow-end-to-end.png`

## 核心概念
展示 oh-my-patent 从用户提出技术主题到最终完成的端到端工作流，包含10个主要阶段、多个分支决策点、崩溃恢复机制。

---

## AI 提示词（中文）- 推荐使用

```
绘制一个现代化的端到端工作流程图，风格类似于专业的 SaaS 产品工作流可视化：

**布局：从上到下，蛇形流动**

顶部起点：
- 浅蓝色圆角矩形"用户提出技术主题"，带有用户图标

第一阶段区域（背景浅灰色）：
- 矩形卡片"INIT: 初始化项目"
- 向下箭头
- 小型文件图标".patent/state.json" + ".brainstorm/path.json"

第二阶段区域（背景浅绿色）：
- 矩形卡片"RESEARCH: 专利检索"
- 向下箭头
- 代理卡片"landscape-analyst" → 文件图标"references/landscape.md"

第三阶段区域（背景浅黄色，较大）：
标题："头脑风暴阶段"

左侧子流程（R1）：
- 卡片"BRAINSTORM R1: 第一轮"
- 向下分出两个并行箭头：
  - 左：蓝色卡片"innovation-architect" - "生成候选方案"
  - 右：红色卡片"adversarial-examiner" - "攻击漏洞"
- 两个箭头汇聚到"评分 + 快照"节点
- 向下箭头到文件图标".brainstorm/nodes/round-1.json"

右侧子流程（R2）：
- 卡片"BRAINSTORM R2: 第二轮深度评估"
- 向下分出三个并行箭头：
  - 左：蓝色卡片"security-engineer" - "安全审查"
  - 中：绿色卡片"compliance-analyst" - "合规检查"
  - 右：紫色卡片"patentability-evaluator" - "专利性评估"
- 三个箭头汇聚到"综合评分"节点

阈值决策点（菱形，陶土色）：
- "阈值检查：新颖性≥7，创造性≥7"
- 左侧红色虚线箭头循环回 BRAINSTORM R1，标注"未通过"
- 右侧绿色实线箭头向下，标注"通过"

第四阶段区域（背景浅紫色）：
- 矩形卡片"DRAFT: 撰写初稿"
- 向下箭头
- 代理卡片"patent-disclosure-writer" → 文件图标"MAIN.md"

第五阶段区域（背景浅橙色，循环区域）：
标题："QA 循环"（最多6轮）

- 卡片"QA_LOOP: 审核-反驳循环"
- 向下箭头
- 代理卡片"patent-disclosure-reviewer" - "提出问题"
- 决策点（菱形，黄色）"有新问题？"
  - 是：向右箭头到"patent-technical-responder" - "撰写修订"
  - 向下箭头到决策点（菱形，黄色）"轮次 ≤ 6？"
    - 是：红色箭头循环回 QA_LOOP
    - 否：向下到 FINAL_REVIEW
  - 否（连续2轮无问题）：绿色箭头直接向下

第六阶段区域（背景浅青色）：
- 卡片"FINAL_REVIEW: 最终审核"
- 决策点（菱形，黄色）"通过？"
  - 未通过：红色虚线箭头循环回 QA_LOOP
  - 通过：绿色箭头向下

第七阶段区域（背景浅蓝色）：
- 卡片"DIAGRAM: 渲染图表"
- 向下箭头
- 代理卡片"diagram-renderer" - "Mermaid/PlantUML → SVG+PNG"
- 向下箭头到"figures/ + 更新 MAIN.md"

底部终点（背景浅绿色）：
- 卡片"DONE: 质量门"
- 向下箭头
- 浅绿色圆角矩形"✅ 完成"，带有勾选图标

**右侧面板（虚线框）**：
标题："分支操作"
- 从 round-1.json 引出虚线到"path branch" - "创建分支探索"
- 从综合评分引出虚线到"path restore" - "恢复被放弃的创新点"

**左侧面板（虚线框，浅红色背景）**：
标题："崩溃恢复"
- 从 RESEARCH、BRAINSTORM R1、DRAFT、QA_LOOP 引出虚线箭头到
- 中央节点"从 state.json 恢复"
- 向下箭头到"从精确断点恢复"

**样式要求**：
- 背景：温暖奶油白 #F7F4EF
- 阶段区域使用不同的浅色背景（灰、绿、黄、紫、橙、青、蓝）
- 主要流程用实线箭头，循环用红色箭头，可选操作用虚线
- 决策点用菱形，起止点用圆角矩形
- 代理卡片使用图标和颜色区分
- 现代扁平化设计，清晰的层次结构
- 专业的技术文档风格

整体呈现从上到下的清晰流动，视觉上突出10个主要阶段的递进关系
```

---

## AI Prompt (English)

```
Create a modern end-to-end workflow diagram, style similar to professional SaaS product workflow visualization:

**Layout: Top-to-bottom, snake-like flow**

Top starting point:
- Light blue rounded rectangle "User proposes technical topic" with user icon

Stage 1 area (light gray background):
- Rectangle card "INIT: Initialize project"
- Downward arrow
- Small file icons ".patent/state.json" + ".brainstorm/path.json"

Stage 2 area (light green background):
- Rectangle card "RESEARCH: Patent search"
- Downward arrow
- Agent card "landscape-analyst" → file icon "references/landscape.md"

Stage 3 area (light yellow background, larger):
Title: "Brainstorming Phase"

Left subprocess (R1):
- Card "BRAINSTORM R1: Round 1"
- Split into two parallel arrows:
  - Left: Blue card "innovation-architect" - "Generate candidates"
  - Right: Red card "adversarial-examiner" - "Attack vulnerabilities"
- Both arrows converge to "Scoring + snapshots" node
- Downward arrow to file icon ".brainstorm/nodes/round-1.json"

Right subprocess (R2):
- Card "BRAINSTORM R2: Round 2 Deep assessment"
- Split into three parallel arrows:
  - Left: Blue card "security-engineer" - "Security review"
  - Center: Green card "compliance-analyst" - "Compliance check"
  - Right: Purple card "patentability-evaluator" - "Patentability assessment"
- Three arrows converge to "Combined scoring" node

Threshold decision point (diamond, terracotta):
- "Threshold check: novelty ≥ 7, creativity ≥ 7"
- Left red dashed arrow loops back to BRAINSTORM R1, labeled "Failed"
- Right green solid arrow downward, labeled "Passed"

Stage 4 area (light purple background):
- Rectangle card "DRAFT: Write initial disclosure"
- Downward arrow
- Agent card "patent-disclosure-writer" → file icon "MAIN.md"

Stage 5 area (light orange background, loop area):
Title: "QA Loop" (max 6 rounds)

- Card "QA_LOOP: Review-rebuttal cycle"
- Downward arrow
- Agent card "patent-disclosure-reviewer" - "Raise issues"
- Decision point (diamond, yellow) "New issues?"
  - Yes: Right arrow to "patent-technical-responder" - "Write revisions"
  - Downward arrow to decision point (diamond, yellow) "Round ≤ 6?"
    - Yes: Red arrow loops back to QA_LOOP
    - No: Downward to FINAL_REVIEW
  - No (2 clean rounds): Green arrow directly downward

Stage 6 area (light cyan background):
- Card "FINAL_REVIEW: Final pass"
- Decision point (diamond, yellow) "Pass?"
  - Not passed: Red dashed arrow loops back to QA_LOOP
  - Passed: Green arrow downward

Stage 7 area (light blue background):
- Card "DIAGRAM: Render figures"
- Downward arrow
- Agent card "diagram-renderer" - "Mermaid/PlantUML → SVG+PNG"
- Downward arrow to "figures/ + update MAIN.md"

Bottom endpoint (light green background):
- Card "DONE: Quality gate"
- Downward arrow
- Light green rounded rectangle "✅ Complete" with checkmark icon

**Right panel (dashed border)**:
Title: "Branch Operations"
- Dashed line from round-1.json to "path branch" - "Create branch to explore"
- Dashed line from combined scoring to "path restore" - "Revive discarded innovation"

**Left panel (dashed border, light red background)**:
Title: "Crash Recovery"
- Dashed arrows from RESEARCH, BRAINSTORM R1, DRAFT, QA_LOOP to
- Central node "Recover from state.json"
- Downward arrow to "Resume from exact breakpoint"

**Style requirements**:
- Background: warm cream #F7F4EF
- Stage areas use different light color backgrounds (gray, green, yellow, purple, orange, cyan, blue)
- Main flow uses solid arrows, loops use red arrows, optional operations use dashed lines
- Decision points use diamonds, start/end use rounded rectangles
- Agent cards use icons and colors to differentiate
- Modern flat design, clear hierarchical structure
- Professional technical documentation style

Overall presents clear top-to-bottom flow, visually highlighting the progression of 10 main stages
```

---

## 方案 2：简化版提示词（适合快速生成）

如果上面的提示词太复杂，可以用这个简化版：

```
创建一个现代的软件工作流程图，从上到下布局：

显示专利生成的10个主要阶段：
1. INIT (初始化)
2. RESEARCH (检索)
3. BRAINSTORM R1 & R2 (头脑风暴两轮，带有并行的评估代理)
4. 阈值检查决策点（菱形，可能循环回头脑风暴）
5. DRAFT (撰写)
6. QA_LOOP (审核循环，最多6轮)
7. FINAL_REVIEW (最终审核)
8. DIAGRAM (图表渲染)
9. DONE (完成)

每个阶段用不同浅色背景的矩形卡片表示
决策点用黄色菱形
循环用红色箭头，正常流程用深色箭头
右侧显示分支操作（虚线）
左侧显示崩溃恢复机制（虚线）

使用温暖奶油白背景 #F7F4EF，陶土色 #C4612F 作为强调色
现代扁平化设计，专业的技术文档风格
清晰的自上而下的流动感
```

---

## 使用建议

### 推荐工具
1. **Midjourney**（最佳）：
   ```
   /imagine prompt: [上述提示词] --ar 2:3 --style raw --v 6
   ```
   注意：工作流图是纵向的，所以用 2:3 比例

2. **DALL-E 3**（通过 ChatGPT Plus）：
   - 直接粘贴提示词
   - 可能需要多次迭代调整细节

3. **Figma + AI 插件**（最精确）：
   - 使用 Figma 的 FigJam 或 Diagram 插件
   - 手动调整布局后导出

### 替代方案：使用现有的 draw.io

draw.io 编辑器已经打开，你可以：

1. **调整布局**：
   - 点击 `Arrange` → `Layout` → `Vertical Flow` 让布局更整齐
   - 调整间距和对齐

2. **美化样式**：
   - 选中所有元素
   - 使用预设的颜色主题（右侧面板）
   - 添加阴影效果：`Format` → `Shadow`

3. **导出高质量图片**：
   - `File` → `Export as` → `PNG`
   - 勾选 `Transparent Background`
   - 设置 DPI 为 300（高质量）

4. **保存为**：
   - `docs/images/ai-gen/workflow-end-to-end.png`

---

## 更新 README 引用

生成后，在 README.md 的工作流部分，将 Mermaid 代码块替换为图片引用：

```markdown
### End-to-End Process Flow

![End-to-End Workflow](docs/images/ai-gen/workflow-end-to-end.png)
```

或者保留 Mermaid 代码作为 fallback，在图片下方添加：

```markdown
### End-to-End Process Flow

![End-to-End Workflow](docs/images/ai-gen/workflow-end-to-end.png)

<details>
<summary>查看 Mermaid 源代码</summary>

\`\`\`mermaid
[原有的 Mermaid 代码]
\`\`\`

</details>
```

这样既有美观的图片，又保留了可编辑的源代码。

---

## 版本历史

- v1.0 (2026-07-08): 初始版本，工作流端到端流程图 AI 生成提示词
