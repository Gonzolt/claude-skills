# oh-my-patent 规格文档索引

欢迎查阅 oh-my-patent 的规格文档！本目录包含产品需求、技术设计和 API 规格。

> ⚠️ **历史快照声明（REQ-033）**：本目录全部内容对应 **v0.1.0（2026-06-17 冻结）**，
> 文中的「已实现 / 已发布」等状态仅反映当时快照，**后续版本（v0.2.x / v0.3.x）的
> 功能变更未回填至此**——例如 OpenCode 适配器、`patent-init-sentinel`、
> `DIAGRAM_DRAFT`/`DIAGRAM_FINAL` 阶段、智慧芽 MCP 等均未在本目录中描述。
> **当前实现的权威来源是 `src/` 与 `plugin.jsonc`**；本目录不参与构建，仅作历史参考。

---

## 📚 文档列表

### 核心规格文档

#### [PRD.md](PRD.md) - 产品需求文档
**版本**: v1.0  
**状态**: ✅ 已实现  
**内容**:
- 产品概述和价值主张
- 目标用户和使用场景
- 功能需求（核心 + 辅助）
- 非功能需求（性能、可靠性、兼容性）
- 数据模型设计
- 成功指标和产品路线图
- 风险与限制分析

**适合阅读者**:
- 产品经理 - 了解产品定位和功能全貌
- 项目负责人 - 评估产品范围和优先级
- 新团队成员 - 快速理解产品价值

---

#### [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md) - 技术设计规格
**版本**: v1.0  
**状态**: ✅ 已实现  
**内容**:
- 系统架构（四层架构）
- 核心模块设计（决策路径、状态机、图表渲染）
- 数据持久化设计
- 智能体架构和通信协议
- 适配器设计模式
- CLI 架构设计
- 性能优化策略
- 错误处理机制
- 测试策略
- 部署架构

**适合阅读者**:
- 系统架构师 - 了解整体技术架构
- 开发工程师 - 实现功能模块
- 技术审查者 - 评估技术方案

---

#### [API-DESIGN.md](API-DESIGN.md) - API 设计文档
**版本**: v1.0  
**状态**: ✅ 已实现  
**内容**:
- CLI API 完整参考
  - path 命令 API
  - diagram 命令 API
  - adapt 命令 API
- TypeScript API 接口
  - 决策路径 API
  - 状态机 API
  - 图表渲染 API
  - 阈值评估 API
- 数据模型 API
- 错误码规范
- 性能指标
- 版本兼容性策略

**适合阅读者**:
- CLI 用户 - 查阅命令用法
- SDK 用户 - 集成 TypeScript API
- API 设计者 - 设计新功能 API

---

## 🎯 快速导航

### 我想...

#### 了解产品定位和功能
👉 阅读 [PRD.md](PRD.md) 第 1-2 章节
- 产品概述
- 核心价值主张
- 功能需求清单

#### 理解系统架构
👉 阅读 [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md) 第 1-2 章节
- 四层架构设计
- 核心模块职责

#### 查阅 CLI 命令用法
👉 阅读 [API-DESIGN.md](API-DESIGN.md) 第 1 章节
- path 命令完整参考
- diagram 命令完整参考
- adapt 命令完整参考

#### 使用 TypeScript API
👉 阅读 [API-DESIGN.md](API-DESIGN.md) 第 2-3 章节
- TypeScript API 接口
- 数据模型定义

#### 了解性能指标
👉 阅读 [PRD.md](PRD.md) 第 3 章节 + [API-DESIGN.md](API-DESIGN.md) 第 5 章节
- 性能要求
- 性能指标

#### 了解测试策略
👉 阅读 [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md) 第 9 章节
- 测试分类
- 测试工具链

---

## 📊 文档关系图

```
PRD.md (产品层)
    ↓ 定义需求
TECHNICAL-DESIGN.md (架构层)
    ↓ 实现设计
API-DESIGN.md (接口层)
    ↓ 对外暴露
用户/开发者
```

---

## 🔄 文档状态

| 文档 | 版本 | 状态 | 最后更新 |
|------|------|------|---------|
| PRD.md | v1.0 | ✅ 已完成 | 2026-06-17 |
| TECHNICAL-DESIGN.md | v1.0 | ✅ 已完成 | 2026-06-17 |
| API-DESIGN.md | v1.0 | ✅ 已完成 | 2026-06-17 |

---

## 📝 文档维护

### 更新流程

1. **需求变更** → 更新 PRD.md
2. **架构调整** → 更新 TECHNICAL-DESIGN.md
3. **API 修改** → 更新 API-DESIGN.md
4. **版本号规则**: Major.Minor (如 v1.0 → v1.1 → v2.0)

### 版本管理

- **Major 版本更新** - 破坏性更改、重大架构调整
- **Minor 版本更新** - 新增功能、非破坏性优化

### 审查周期

- **PRD**: 每个大版本发布前（v0.1 → v0.2）
- **技术设计**: 重大架构调整时
- **API 设计**: 每次 API 变更后

---

## 🔗 相关文档

### 项目文档
- [../../README.md](../../README.md) - 用户文档（中文）
- [../../README-en.md](../../README-en.md) - 用户文档（英文）
- [../../CLAUDE.md](../../CLAUDE.md) - 项目说明
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md) - 贡献指南

### 可视化文档
- [../workflow-diagram.md](../workflow-diagram.md) - 工作流图示（中文）
- [../workflow-diagram-en.md](../workflow-diagram-en.md) - 工作流图示（英文）

### 文档索引
- [../README.md](../README.md) - 文档中心索引（中文）
- [../README-en.md](../README-en.md) - 文档中心索引（英文）

---

## 💡 使用建议

### 新团队成员入门路径

1. **第一天**: 阅读 [PRD.md](PRD.md)
   - 了解产品定位和核心功能
   - 理解用户痛点和解决方案

2. **第二天**: 阅读 [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md)
   - 理解系统架构
   - 熟悉核心模块设计

3. **第三天**: 阅读 [API-DESIGN.md](API-DESIGN.md)
   - 熟悉 CLI 命令
   - 了解 TypeScript API

4. **第四天**: 查看 [workflow-diagram.md](../workflow-diagram.md)
   - 可视化理解工作流
   - 查看智能体协作图

### 功能开发路径

1. **需求分析** → PRD.md 添加功能需求
2. **技术设计** → TECHNICAL-DESIGN.md 添加模块设计
3. **API 定义** → API-DESIGN.md 定义接口
4. **实现开发** → 编写代码
5. **文档更新** → 同步更新 README 和 workflow-diagram

---

## ❓ 常见问题

### Q: 文档版本号如何管理？
A: 遵循 Semantic Versioning（语义化版本）。Major 版本表示破坏性更改，Minor 版本表示新增功能。

### Q: 文档与代码如何保持同步？
A: 每次 PR 合并前，人工检查是否需要更新相关规格文档。（本快照冻结于 v0.1.0，见顶部历史声明；当前仓库的 `ci.yml` 在 PR 与 push 上跑 `lint` + `test`，Release 触发 `npm-publish.yml` —— **两者都不含**文档检查。）

### Q: 如何贡献规格文档？
A: 参考 [../../CONTRIBUTING.md](../../CONTRIBUTING.md)，遵循文档规范，提交 PR 前确保格式一致。

### Q: 规格文档使用什么格式？
A: 统一使用 Markdown 格式，支持 Mermaid 图表。

---

## 📜 变更历史

### v1.0 (2026-06-17)
- ✅ 创建 PRD.md（产品需求文档）
- ✅ 创建 TECHNICAL-DESIGN.md（技术设计规格）
- ✅ 创建 API-DESIGN.md（API 设计文档）
- ✅ 创建 README.md（本索引文档）

---

**索引版本**: v1.0  
**最后更新**: 2026-06-17  
**维护者**: @zengbods
