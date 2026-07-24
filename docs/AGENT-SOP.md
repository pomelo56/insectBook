# AI 重构工作手册 (Agent SOP)

> 最后更新：2026-07-24  
> 阅读顺序：先看 `docs/domain-model.md`，再看本文档

---

## 角色分工

| 角色 | 职责 | 产出物 |
|------|------|--------|
| **工程师** | 编写代码、Service 拆分、云函数合并、页面瘦身 | `.js` 文件变更 |
| **QA** | 编写测试、验证回归、检查规范遵从度 | 新增测试 + 验证报告 |
| **架构师** | 审查方案、确认边界、处理跨模块依赖 | ADR / 架构决策 |
| **主理人** | 需求确认、优先级判断、最终验收 | 需求确认 + 验收结果 |

---

## 工作流

### 每次代码变更前

1. **读领域模型** → `docs/domain-model.md`
2. **读数据 Schema** → `docs/database-schema.md`
3. **读 API 契约** → `docs/cloud-function-api-contract.md`
4. **确认当前状态** → `docs/current-state.md`（避免踩历史坑）
5. **创建/确认分支** → `loop/<phase>-<name>`
6. **写测试先行** → 在写任何业务代码前先写 failing test

### TDD 循环

```
[红] 写一个失败的测试
[绿] 写最少代码让测试通过
[重构] 清理代码，保持测试通过
```

### 每步完成后的验收

- [ ] 新增/修改的测试全部通过
- [ ] 原有测试全部通过
- [ ] 遵守 `CONVENTIONS.md` 约束（行数、命名、async/await）
- [ ] 无 `console.log` 调试残留
- [ ] git commit message 符合 `[phase-N] description` 格式

---

## 禁止事项

| 禁止行为 | 原因 |
|---------|------|
| 修改 `app.json` 中的页面路由 | 影响 TabBar 和子包结构 |
| 删除任何云函数目录 | 先归档到 `_archive/` |
| 在生产环境执行数据库迁移 | 必须先备份再迁移 |
| 硬编码 API Key 或 Secret | 使用环境变量 |
| 跳过测试直接改代码 | 违反 TDD |
| 一次改太多文件 | 每个 Loop 聚焦单一目标 |
| 不记录 ADR 就改架构决策 | 后续 AI Agent 无法理解为什么 |
| 将 debugInfo/debugLogs 返回客户端 | 安全风险 |

---

## Git 纪律

```bash
# 开分支
git checkout -b loop/<N>-<module-name>

# 提交格式
git commit -m "[phase-1] extract cacheService with 8 unit tests"
git commit -m "[phase-0] clean debug logs and unify insect name map"

# 回滚点
git checkout 6e532e8   # vibe coding baseline
```

---

## 核心约束

### 文件行数上限

| 文件类型 | 上限 |
|---------|------|
| Page `.js` | 200 行 |
| Service `.js` | 150 行 |
| 云函数 index.js | 50 行（路由层） |
| Handler `.js` | 80 行 |
| WXSS | 100 行（组件化后） |

### async/await 规则

- 不使用超过 2 层 callback 嵌套
- 用 `timeoutWrap()` 替代手动 setTimeout
- cloud functions 中优先使用 `async/await`

### ID 系统

- 所有昆虫查询使用 `externalId`（格式 `insect_<uuid>`）
- 不再使用 `name` 作为查询 key
- `user_insects.insectExternalId` 引用 `insects.externalId`

---

## 重构 Phase 总览

| Phase | 目标 | 核心交付 |
|-------|------|---------|
| 0 | 止血 | 清调试日志 + 统一命名 + DB 备份 + 补全测试基线 |
| 1 | Service 拆分 | 8 个 Service + Page < 200 行 |
| 2 | 云函数合并 | 3 个入口 + handlers |
| 3 | ID 重构 | externalId 统一 + 数据迁移 |
| 4 | TDD 回归 | 覆盖率 ≥ 60% |
| 5 | 架构增强 | async/await + Token 样式 + Discovery 接入真实数据 |
