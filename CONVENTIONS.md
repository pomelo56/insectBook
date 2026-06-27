# insectBook 编码约定

> 所有团队成员（工程师、架构师、QA）必须遵守

## 基本规则

1. **Page 文件 < 200行** — 只做 UI 绑定和事件分发，业务逻辑委托 Service
2. **Service 文件 < 150行** — 单一职责，不超过 5 个导出函数
3. **async/await 优先** — 不使用超过 2 层的回调嵌套，用 `timeoutWrap()` 替代手动 setTimeout
4. **统一错误处理** — 所有 Service 错误通过 `errorHandler.js` 统一处理，不散布各处
5. **externalId 做 ID** — 不用 name 查询昆虫，全部使用 externalId

## 命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| Service 文件 | camelCase + Service | insectService.js |
| 云函数 action | camelCase | getInsectList |
| Page data 字段 | camelCase | insectList, currentLevel |
| WXML class | BEM-like | insect-card__title, insect-card--featured |
| WXSS 颜色 | 从 design-system token 取值 + 注释标注 | `#2a9d8f /* --color-primary */` |

## require 顺序

```js
// 1. Service 层
const insectService = require('../../services/insectService')
const cacheService = require('../../services/cacheService')

// 2. Utils 层
const { timeoutWrap } = require('../../utils/timeoutWrap')

// 3. Page 定义
Page({
  data: { ... },
  onLoad() { ... },
  ...
})
```

## Git 分支策略

- 每个Loop在独立分支开发: `loop/<N>-<module-name>`
- 通过Review后才合并到 master
- 分支命名示例: `loop/1-1-insectService`

## 文件编码

- 所有 JS/WXML/WXSS 文件使用 UTF-8 编码
- 中文注释使用简体中文
- 不在代码中使用 emoji

## 测试约定

- 测试文件放在 `tests/unit/<service-name>.test.js`
- 测试框架: Jest
- 每个 Service 至少测试核心导出函数
- 测试覆盖目标: ≥ 60% 核心路径
