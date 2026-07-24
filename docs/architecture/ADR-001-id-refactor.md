# ADR-001: 昆虫 ID 系统重构方案

> 状态：已归档（待执行）  
> 创建日期：2026-07-24  
> 决策者：架构师 + 主理人

---

## 背景

当前系统中存在三种 ID 引用方式：

1. **MongoDB `_id`** — 集合自动生成的 ObjectId
2. **从 `name` 派生的 ID** — `markFound` 中 `name.toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')`
3. **`externalId`** — 部分云函数中手动设置的 `insect_<uuid>` 格式

这导致：
- 中文名称作为查询 key 需要 URL 编码
- 同名不同物种可能冲突
- 跨端/跨用户数据关联不稳定
- 测试和迁移困难

## 决策

**采用统一的 externalId 系统**：

- `externalId` 格式为 `insect_<uuid>`（使用 `crypto.randomUUID()` 生成）
- `insects.name` 保留为显示字段，不再参与查询
- `user_insects.insectExternalId` 统一引用 `insects.externalId`
- 所有 API（前端/云函数）统一使用 `externalId` 进行昆虫关联

## 实施步骤

1. 为现有 `insects` 集合批量补充 `externalId` 字段
2. `user_insects` 中新增 `insectExternalId`，迁移原有 `insectId`
3. 云函数支持新旧 ID 双读兼容期
4. 前端全量替换为 `externalId`
5. 移除兼容层

## 约束

- 迁移前必须导出 DB 快照
- 兼容期内同时支持 `name` 和 `externalId` 两种查询路径
- 不在同一 PR 中完成迁移脚本和业务代码变更

## 关联文档

- `docs/database-schema.md`
- `docs/cloud-function-api-contract.md`
- `docs/domain-model.md`
