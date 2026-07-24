# ADR-004: TDD 先行作为重构铁律

> 状态：待执行  
> 创建日期：2026-07-24  
> 决策者：架构师 + 主理人

---

## 背景

当前项目只有一个测试文件（`insectService.test.js`，45 个测试），覆盖率约 30-40%。云函数、Page 组件、Service 层大部分没有测试覆盖。

在 AI Agent 参与重构的场景下，没有测试 = 没有安全网。AI 可能会：
- 修改了 markFound 的业务逻辑但没发现 bug
- 拆分 Service 时破坏了原有调用关系
- 引入 regression 而无人察觉

---

## 决策

**所有代码变更必须遵循 TDD 循环**：

```
[红] 写一个失败的测试（描述期望行为）
[绿] 写最少代码让测试通过
[重构] 清理代码，保持测试通过
```

### 测试分层

| 层次 | 工具 | 覆盖范围 | 触发时机 |
|------|------|---------|---------|
| Unit | Jest | 每个 Service 的导出函数 | 每次写 Service 时 |
| Unit (Cloud) | Jest | 每个 handler 的 action 路由 + 核心逻辑 | 每次合并云函数时 |
| Integration | Jest + mock DB | 云函数端到端（入参→出参） | Phase 4 集中补全 |
| E2E | miniprogram-automator（可选） | 完整用户流程 | 发布前 |

### 覆盖率目标

| 阶段 | 目标 |
|------|------|
| Phase 1 完成 | Service 覆盖率 ≥ 80%，Page 覆盖率 ≥ 40% |
| Phase 2 完成 | Cloud handler 覆盖率 ≥ 70% |
| Phase 4 完成 | 核心路径覆盖率 ≥ 60%，整体 ≥ 50% |

---

## 为什么不用 BDD / Cucumber？

1. 微信小程序生态中 Jest 是最成熟的测试框架
2. BDD 的 Given/When/Then 格式对本项目的测试收益不大
3. 团队（包括 AI Agent）更习惯 `test('description', () => { ... })` 的风格

---

## 约束

- **测试文件与源文件同目录**：`tests/unit/<service-name>.test.js`
- **每个 Service 至少测试核心导出函数**
- **Mock 所有外部依赖**：wx API、云数据库、网络请求
- **不要为了测试覆盖率写无意义的测试**——测试应该验证行为，不是覆盖分支

---

## 关联文档

- `AGENT-SOP.md`
- `jest.config.js`
- `CONVENTIONS.md`
