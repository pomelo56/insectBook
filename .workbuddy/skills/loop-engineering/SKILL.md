---
name: loop-engineering
description: Loop Engineering 工作流程 — Plan→Build→Test→Review 循环模型，用于 insectBook 重构
version: 1.0
---

# Loop Engineering Skill

## 触发条件
- 重构 insectBook 的任何模块
- 执行 ENGINEERING-PLAN.md 中 Phase 1-3 的子任务

## 工作流程

每个 Loop 严格遵循 4 步循环：

```
Plan → Build → Test → Review
```

### Step 1: Plan（计划）
- 读取当前模块源码，理解现状
- 确认本次 Loop 的拆分目标（从 ENGINEERING-PLAN.md L1 层任务列表中获取）
- 创建 Git 分支: `git checkout -b loop/<N>-<module-name>`
- 确认输入依赖已满足

### Step 2: Build（实现）
- 按计划拆分模块：从 Page 对象中抽离 Service
- 每个新 Service 文件必须：
  - 单一职责（只做一件事）
  - 清晰的导出接口（其他模块通过接口调用，不直接访问内部）
  - 无硬编码数据（从 knowledge/insect-data-schema 获取数据定义）
- Page 文件修改为：只做 UI 绑定 + 事件分发，业务逻辑委托 Service
- 每个 Page 文件目标行数 < 200

### Step 3: Test（验证）
- 为拆出的 Service 编写单元测试
- 测试文件放在 `tests/unit/<service-name>.test.js`
- 运行测试：`npm test`
- 如果测试失败 → 判断路由：
  - 源码 Bug → 修复源码
  - 测试 Bug → 修复测试
- 测试通过 → 继续 Step 4

### Step 4: Review（审查）+ Merge（合并）
- 全局一致性审查：
  - 新 Service 接口是否被 Page 正确引用
  - 是否有遗漏的硬编码数据
  - Page 文件是否 < 200 行
  - IS_PASS: YES/NO 判定
- IS_PASS: YES → `git checkout master && git merge loop/<N>-<module-name>`
- IS_PASS: NO → 修复后重新审查（最多 2 轮）

### Loop 失败回滚
- `git checkout master && git branch -D loop/<N>-<module-name>`
- 回退到 merge 前的 master 状态，之前的 Loop 成果不受影响

## 禁止事项
- ❌ 不在同一个 Loop 里同时拆多个模块（每个 Loop 只改一个模块）
- ❌ 不跳过 Test 直接 Review
- ❌ 不在没有 Git 分支的情况下直接在 master 上改代码
- ❌ 不把拆出的 Service 又塞回 Page 文件
