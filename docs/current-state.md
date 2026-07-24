# 当前状态真相文档 (Current State Truth Document)

> 最后更新：2026-07-24  
> 目的：记录代码中"看起来不合理但有原因"的设计决策和债务来源，避免 AI Agent 将历史债误认为有意设计。

---

## 项目起源

本项目最初由一名用户以 "vibe coding"（让 AI 边想边写）方式快速搭建，核心目标是验证"拍照识别昆虫 → 记录图鉴"的 MVP 流程。随后引入了 Loop Engineering + Agentic Engineering 方法论进行系统化重构。

**Git 回滚基线**：`commit 6e532e8` — vibe coding 全貌快照，可随时 `git checkout 6e532e8` 回退。

---

## 已知的"有意为之"的技术债

### 1. camera.js 的 16 条 `【调试】` 日志

**不是 bug，是开发调试遗留。** 这些日志在 MVP 阶段帮助排查图片时间戳解析、云函数超时等问题。重构时必须全部清理，不应保留任何一条带有 `【调试】` 前缀的 console.log。

**为什么没有被清理**：当时重构重点在 Service 拆分，调试日志优先级低。

### 2. markFound 中 fire-and-forget 调用 syncInsectData

**不稳定的设计选择。** 原始意图是"保存成功后异步触发数据同步"，但问题是：
- `cloud.callFunction` 返回 Promise 但未 await
- 错误处理通过 `.catch()` 静默吞掉
- 如果 sync 失败，数据库可能不一致（user_insects 已写入，insects 未同步）

**为什么还没改**：因为 markFound 的主流程必须快，开发者担心同步等待会影响用户体验。后续应改为：事务内同步，或引入异步任务队列。

### 3. fetchBaiduEncyclopedia 返回 debugInfo

**安全漏洞。** 该函数将内部调试信息（HTTP 状态码、选择器匹配结果、执行耗时等）作为 `debugInfo` 字段返回给客户端。这不应该发生。

**为什么还有**：开发阶段便于调试百科抓取逻辑，上线时忘记清理。

### 4. insectNameMap 重复定义 3 次

**维护不一致的风险源。** `INSECT_NAME_MAP` 同时出现在：
- `miniprogram/pages/camera/camera.js`
- `miniprogram/subpages/insect-detail/insect-detail.js`
- `miniprogram/utils/imageHelper.js`

三个版本内容略有差异（如 imageHelper.js 包含"重陽木锦斑蛾"→"重阳木锦斑蛾"繁简转换）。这不是有意设计，而是不同时期分别添加导致的分裂。重构时必须统一到 `utils/insectNormalizer.js`。

### 5. Discovery 页面硬编码数据

**功能未完成。** `discovery/discovery.js` 中的 `insectDiscoveries` 数组全是模拟数据，注释写着"模拟数据 - 实际应用中应该从云数据库获取"。这是 MVP 阶段先占位的做法，尚未实现真实后端接入。

**是否要在重构中完成？** 取决于产品优先级，不是纯技术问题。

### 6. updateInsectEncyclopedia / saveFunFactSimple / deleteFunFactSimple 命名不一致

**历史遗留的命名碎片。** admin 页面调用了 `saveFunFactSimple` 而不是同名目录下的 `saveFunFact`。原因是测试阶段创建了简化版函数名，之后没有回滚到标准命名。同样，`getUserOpenid`（小写 d）和 `getOpenId`（大写 D）是两个不同的云函数目录，功能相同。

**建议**：统一命名后删除旧版本，但在 ID 重构前不要动（可能影响已有部署的云函数引用）。

---

## 不应被误判为"设计"的行为

| 行为 | 实际上是 |
|------|---------|
| 大量 `console.log` + `console.error` 散落在业务逻辑中 | 调试残留 |
| 手动 setTimeout 超时保护嵌套在 callback 中 | async/await 尚未迁移 |
| `if (!cacheData)` 条件永不触发 | 误写，应该是检查特定字段 |
| `cachedCount` 从 storage 读取后被忽略 | 无意义代码 |
| `photoTimestamp` 的正则表达式解析逻辑 | 过度工程化的调试方案，应简化 |
| `insectDetail-new.js` 存在但未启用 | 尝试性替代方案，待确认废弃 |

---

## 环境约束（AI 必须遵守）

1. **云开发环境 ID**：`cloud1-8ggzed032ed5ec`（写在 app.js 中）
2. **AI 识别 API**：火山方舟 Doubao Seed 1.6 Vision，环境变量在 calliNat 云函数中配置
3. **微信云数据库**：不可直接 SQL 查询，使用 `.where().orderBy().limit().skip()` 语法
4. **小程序分包限制**：主包 + 独立子包，不能跨包直接 require
5. **云函数间调用**：使用 `cloud.callFunction({ name })`，注意冷启动延迟
6. **用户 openid 获取**：小程序启动时自动调用 `getOpenId` 并缓存到 `globalData.openid`

---

## 回滚机制

```bash
# 任何时候觉得重构方向不对：
git checkout 6e532e8   # 回到 vibe coding 全貌
git reset --hard HEAD   # 丢弃所有未提交更改

# 重构分支：
git checkout loop/1-1-insectService   # 已有的重构分支
```
