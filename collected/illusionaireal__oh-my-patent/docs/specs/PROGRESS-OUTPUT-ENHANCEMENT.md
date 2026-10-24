# oh-my-patent 进度输出增强方案

> ⚠️ **历史快照（v0.1.0 时期，2026-06-17）**：本文件是当时的方案记录，**不再更新、不参与构建**。
> 规格的规范位置是仓库根 [`specs/`](../../specs/)；当前实现以 `src/` 与 `plugin.jsonc` 为准。
> 目录级声明见 [README.md](README.md)。

**问题**: Archimedes 主编排器执行流程时全程没有任何输出，用户体验差  
**需求**: 增加实时进度提示，让用户了解当前执行状态  
**日期**: 2026-06-17

---

## 方案设计

### 1. 输出内容设计

#### 阶段转换输出
```
✅ 初始化完成
   - 项目目录: projects/01-homomorphic-encryption/
   - Git 仓库已初始化

🔍 开始专利检索...
   - 检索关键词: 同态加密、隐私计算、多方安全计算
   - 检索范围: 近5年专利文献

✅ 检索完成
   - 找到相关专利: 23 篇
   - 生成景观分析: references/landscape.md

🧠 开始第1轮头脑风暴...
   - 正在生成创新点候选...

✅ 第1轮头脑风暴完成
   - 生成创新点: 5 个
   - 最高评分: INN-001 (8.5/10)
   - 创新度: 新颖性 8/10, 创造性 9/10
   - 决策: 继续第2轮深度评估

🧠 开始第2轮头脑风暴...
   - 正在进行安全性审查...
   - 正在进行合规性分析...
   - 正在进行可专利性评估...

✅ 第2轮头脑风暴完成
   - 通过阈值检查 ✓
   - 最终创新点: INN-001 (综合评分 8.7/10)
   - 决策: 进入撰写阶段

📝 开始撰写交底书初稿...

✅ 初稿完成
   - 文档: MAIN.md (3500 字)
   - 包含章节: 技术背景、技术方案、实施例、有益效果

🔍 开始第1轮QA审查...

✅ 第1轮QA完成
   - 发现问题: 5 个
   - 已生成修订建议: references/qa_round1_responder.md

🔍 开始第2轮QA审查...

✅ 第2轮QA完成
   - 发现问题: 0 个
   - 连续2轮无问题，通过审查 ✓

🎨 开始渲染专利附图...
   - 渲染图表: 3 个

✅ 附图渲染完成
   - 输出: figures/001-system.svg, figures/002-flow.svg, figures/003-structure.svg
   - 已更新 MAIN.md 图表引用

🎉 专利交底书生成完成！
   - 交底书: MAIN.md
   - 附图: figures/ (3个)
   - 决策路径: .brainstorm/
   - 对话记录: conversation.md
```

---

### 2. 实现方案

#### 方案A: 在 Archimedes.md 中添加输出指令（推荐）

修改 `src/agents/archimedes.md`，在每个阶段执行前后输出进度：

```markdown
工作流程（增强版）：

1. **初始化阶段**
   - 输出: "✅ 初始化完成\n   - 项目目录: {path}\n   - Git 仓库已初始化"
   - 创建项目目录和 Git 仓库
   
2. **检索阶段**
   - 输出: "🔍 开始专利检索...\n   - 检索关键词: {keywords}\n   - 检索范围: 近5年专利文献"
   - 调用 @patent-landscape-analyst
   - 输出: "✅ 检索完成\n   - 找到相关专利: {count} 篇\n   - 生成景观分析: references/landscape.md"

3. **头脑风暴第1轮**
   - 输出: "🧠 开始第1轮头脑风暴...\n   - 正在生成创新点候选..."
   - 调用子代理
   - 输出: "✅ 第1轮头脑风暴完成\n   - 生成创新点: {count} 个\n   - 最高评分: {id} ({score}/10)\n   - 创新度: 新颖性 {n}/10, 创造性 {c}/10\n   - 决策: {decision}"

4. **头脑风暴第2轮**
   - 输出: "🧠 开始第2轮头脑风暴...\n   - 正在进行安全性审查...\n   - 正在进行合规性分析...\n   - 正在进行可专利性评估..."
   - 调用子代理
   - 输出: "✅ 第2轮头脑风暴完成\n   - 通过阈值检查 ✓\n   - 最终创新点: {id} (综合评分 {score}/10)\n   - 决策: 进入撰写阶段"

... (继续其他阶段)
```

**优点**:
- 简单直接，不需要修改代码
- 智能体自己控制输出时机
- 输出内容灵活

**缺点**:
- 依赖智能体严格遵守输出指令
- 可能被智能体"忘记"

---

#### 方案B: 创建进度输出工具类

在 `src/core/progress.ts` 中创建进度输出工具：

```typescript
// src/core/progress.ts

export enum ProgressStage {
  INIT = 'INIT',
  RESEARCH = 'RESEARCH',
  BRAINSTORM_R1 = 'BRAINSTORM_R1',
  BRAINSTORM_R2 = 'BRAINSTORM_R2',
  DRAFT = 'DRAFT',
  QA_LOOP = 'QA_LOOP',
  FINAL_REVIEW = 'FINAL_REVIEW',
  DIAGRAM = 'DIAGRAM',
  DONE = 'DONE'
}

export interface ProgressData {
  stage: ProgressStage;
  metadata?: Record<string, unknown>;
}

export class ProgressReporter {
  private static instance: ProgressReporter;
  
  private constructor() {}
  
  static getInstance(): ProgressReporter {
    if (!ProgressReporter.instance) {
      ProgressReporter.instance = new ProgressReporter();
    }
    return ProgressReporter.instance;
  }
  
  // 阶段开始
  stageStart(stage: ProgressStage, metadata?: Record<string, unknown>): void {
    const messages = {
      [ProgressStage.INIT]: '✅ 初始化完成',
      [ProgressStage.RESEARCH]: '🔍 开始专利检索...',
      [ProgressStage.BRAINSTORM_R1]: '🧠 开始第1轮头脑风暴...',
      [ProgressStage.BRAINSTORM_R2]: '🧠 开始第2轮头脑风暴...',
      [ProgressStage.DRAFT]: '📝 开始撰写交底书初稿...',
      [ProgressStage.QA_LOOP]: '🔍 开始QA审查...',
      [ProgressStage.FINAL_REVIEW]: '🔍 开始最终审查...',
      [ProgressStage.DIAGRAM]: '🎨 开始渲染专利附图...',
      [ProgressStage.DONE]: '🎉 专利交底书生成完成！'
    };
    
    console.log(messages[stage]);
    
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        console.log(`   - ${key}: ${value}`);
      }
    }
  }
  
  // 阶段完成
  stageComplete(stage: ProgressStage, metadata?: Record<string, unknown>): void {
    console.log(`✅ ${this.getStageName(stage)}完成`);
    
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        console.log(`   - ${key}: ${value}`);
      }
    }
  }
  
  // 子任务进度
  subTask(message: string): void {
    console.log(`   - ${message}`);
  }
  
  private getStageName(stage: ProgressStage): string {
    const names = {
      [ProgressStage.INIT]: '初始化',
      [ProgressStage.RESEARCH]: '检索',
      [ProgressStage.BRAINSTORM_R1]: '第1轮头脑风暴',
      [ProgressStage.BRAINSTORM_R2]: '第2轮头脑风暴',
      [ProgressStage.DRAFT]: '初稿撰写',
      [ProgressStage.QA_LOOP]: 'QA审查',
      [ProgressStage.FINAL_REVIEW]: '最终审查',
      [ProgressStage.DIAGRAM]: '附图渲染',
      [ProgressStage.DONE]: '全部'
    };
    return names[stage];
  }
}

// 便捷函数
export const progress = ProgressReporter.getInstance();
```

**使用示例**:
```typescript
import { progress, ProgressStage } from './core/progress.js';

// 在 workflow.ts 中
progress.stageStart(ProgressStage.RESEARCH, {
  '检索关键词': '同态加密、隐私计算',
  '检索范围': '近5年专利文献'
});

// 调用子代理...

progress.stageComplete(ProgressStage.RESEARCH, {
  '找到相关专利': '23 篇',
  '生成景观分析': 'references/landscape.md'
});
```

**优点**:
- 统一的进度输出接口
- 易于测试和维护
- 可扩展（日志、远程监控等）

**缺点**:
- 需要修改现有代码
- 增加代码复杂度

---

#### 方案C: CLI 进度条（高级）

使用 `cli-progress` 或类似库，提供可视化进度条：

```typescript
import cliProgress from 'cli-progress';

const multibar = new cliProgress.MultiBar({
  clearOnComplete: false,
  hideCursor: true,
  format: '[{bar}] {stage} | {percentage}% | {value}/{total} steps'
}, cliProgress.Presets.shades_classic);

const bar = multibar.create(10, 0, { stage: 'Initializing' });

// 更新进度
bar.update(1, { stage: 'Research' });
bar.update(2, { stage: 'Brainstorm R1' });
// ...
bar.update(10, { stage: 'Done' });

multibar.stop();
```

**优点**:
- 视觉效果好
- 实时进度显示

**缺点**:
- 增加依赖
- 在某些终端环境下可能不兼容

---

### 3. 推荐方案（混合）

**阶段1（快速实现）**: 方案A - 在 Archimedes.md 中添加输出指令

**阶段2（长期优化）**: 方案B - 实现 ProgressReporter 工具类

---

### 4. 具体实施步骤

#### 步骤1: 修改 Archimedes.md

在每个工作流阶段添加明确的输出指令：

```markdown
## 强制输出规则（必须遵守）

### 阶段转换输出

每个阶段**必须**输出进度信息，格式如下：

**初始化阶段**:
```
✅ 初始化完成
   - 项目目录: projects/{NN}-{topic_slug}/
   - Git 仓库已初始化
```

**检索阶段开始**:
```
🔍 开始专利检索...
   - 检索关键词: {keywords}
   - 检索范围: 近5年专利文献
```

**检索阶段完成**:
```
✅ 检索完成
   - 找到相关专利: {count} 篇
   - 生成景观分析: references/landscape.md
```

... (其他阶段类似)
```

#### 步骤2: 创建进度输出示例命令

在 `src/commands/` 中创建 `progress-example.md`：

```markdown
# 进度输出示例

## 完整流程输出示例

```
✅ 初始化完成
   - 项目目录: projects/01-homomorphic-encryption/
   - Git 仓库已初始化

🔍 开始专利检索...
   - 检索关键词: 同态加密、隐私计算、多方安全计算
   - 检索范围: 近5年专利文献

✅ 检索完成
   - 找到相关专利: 23 篇
   - 生成景观分析: references/landscape.md

... (完整流程)
```
```

---

### 5. 测试验证

#### 测试用例1: 新建项目

**输入**: 创建一个关于"同态加密隐私计算"的专利项目

**期望输出**:
```
✅ 初始化完成
   - 项目目录: projects/01-homomorphic-encryption/
   - Git 仓库已初始化
   
🔍 开始专利检索...
... (后续输出)
```

#### 测试用例2: 头脑风暴阶段

**期望输出**:
```
🧠 开始第1轮头脑风暴...
   - 正在生成创新点候选...
   
✅ 第1轮头脑风暴完成
   - 生成创新点: 5 个
   - 最高评分: INN-001 (8.5/10)
   - 创新度: 新颖性 8/10, 创造性 9/10
   - 决策: 继续第2轮深度评估
```

---

### 6. 未来增强

#### 6.1 实时日志流

将进度输出写入 `project/.patent/progress.log`：

```typescript
export class ProgressLogger {
  private logFile: string;
  
  constructor(projectPath: string) {
    this.logFile = join(projectPath, '.patent', 'progress.log');
  }
  
  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    appendFileSync(this.logFile, logLine);
    console.log(message);
  }
}
```

#### 6.2 Web 界面实时监控

通过 WebSocket 推送进度到 Web 界面：

```typescript
import WebSocket from 'ws';

export class ProgressBroadcaster {
  private ws: WebSocket;
  
  broadcast(stage: string, data: unknown): void {
    this.ws.send(JSON.stringify({ stage, data }));
  }
}
```

#### 6.3 Slack/钉钉通知

关键阶段完成后发送通知：

```typescript
export class ProgressNotifier {
  async notifyStageComplete(stage: string): Promise<void> {
    // 发送到 Slack/钉钉
    await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        text: `✅ ${stage} 完成`
      })
    });
  }
}
```

---

## 总结

**立即可行**: 修改 `archimedes.md`，添加强制输出指令  
**短期目标**: 实现 `ProgressReporter` 工具类  
**长期目标**: Web 界面实时监控 + 通知集成

**优先级**: P0（用户体验严重影响）  
**预计工作量**: 2-4 小时（方案A）

---

**文档版本**: v1.0  
**创建日期**: 2026-06-17
