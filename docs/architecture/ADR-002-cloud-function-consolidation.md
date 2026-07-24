# ADR-002: 云函数合并为统一入口

> 状态：待执行  
> 创建日期：2026-07-24  
> 决策者：架构师 + 主理人

---

## 背景

当前项目有 **23 个独立云函数目录**，每个目录对应一个单一功能。这导致：
- 部署管理成本高（每次更新要重新部署多个函数）
- 代码重复严重（验证、权限检查在每个函数中重复）
- 冷启动延迟叠加
- 前端需要记住大量函数名

---

## 决策

**将 23 个云函数合并为 3 个统一入口**，每个入口通过 `action` 参数路由到不同 handler：

```
cloudfunctions/
├── insectApi/index.js       → action: list | detail | images | sync | updateImage | updateEncyclopedia | fetchEncyclopedia
├── userApi/index.js         → action: getOpenId | getUserList | checkPermission | markFound | recognition
└── adminApi/index.js        → action: badgeSave | badgeDelete | badgeList | funFactSave | funFactDelete | funFactList
```

旧云函数目录不删除，归档到 `cloudfunctions/_archive/`。

---

## 为什么是 3 个而不是 1 个？

| 方案 | 优点 | 缺点 |
|------|------|------|
| 1 个大入口 | 管理最简单 | 一个 index.js 会变得巨大，难以维护 |
| **3 个按领域分** | 职责清晰、便于多人并行开发 | 入口数量略多 |
| 保留 23 个 | 最小改动 | 技术债持续积累 |

选择 3 个是基于"职责单一"和"可并行开发"的平衡。

---

## 对前端的兼容性要求

重构前后，小程序端的调用方式必须保持一致：

```javascript
// 重构前
wx.cloud.callFunction({ name: 'getInsectDetail', data: { insectName: '蝴蝶' } })

// 重构后
wx.cloud.callFunction({ name: 'insectApi', data: { action: 'getInsectDetail', insectName: '蝴蝶' } })
```

但注意：**这改变了 `name` 参数**。为了最大化兼容性，可以：
1. 旧云函数保留不删，新 `insectApi` 作为并行版本
2. 前端逐步切换调用
3. 全部切换完成后清理旧函数

或者采用更激进的方式：直接替换所有 `name` 值。考虑到当前代码量可控（约 20 处 `callFunction`），直接替换更简单。

---

## 约束

- 每个 handler < 80 行
- `index.js` 路由层 < 50 行
- 不改变任何入参/出参格式
- 一次性脚本（fillRealData、createMissingCollections）移至 `scripts/`，不作为常驻云函数

---

## 关联文档

- `docs/cloud-function-api-contract.md`
- `ARCHITECTURE.md`
