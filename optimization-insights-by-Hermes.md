# insectBook 项目优化洞察

> 分析者：Hermes Agent（by Nous Research）
> 分析时间：2026-07-04
> 状态：只读分析，未修改任何代码

---

## 一、结构问题

### 1. 异常臃肿的上帝页面
- **`camera.js` 1189 行**，**`index.js` 794 行**。两者都混了太多职责：`camera.js` 内嵌了图片压缩、Base64 转换、超时控制、手势缩放、手动输入、详情清理等多段复杂逻辑。
- **建议**：持续抽离：
  - `camera.js` → `compressImage` / `saveDiscovery` / 手势逻辑独立到 `utils/` 或 `services/`
  - `index.js` → 冷知识、等级系统、图片修复也应各自成 service

### 2. 常量/配置散落各处
- **硬编码 `30`** 出现在 `insectService.js` 多处作为默认昆虫总数；
- **默认图片路径不统一**：`/images/empty_insect.png` vs `/images/default_insect.png`；
- **缓存键名分散**在多个文件中，有 `recent_insects`、`cached_user_level`、`cached_cold_knowledge`、`insectFoundCountCache` 等十余个，无集中管理。
- **建议**：增加 `miniprogram/utils/constants.js` 统一管理缓存键、默认总量、默认图片、分页 size、超时时间等。

### 3. 重复映射表
- `INSECT_NAME_MAP` 在 **`camera.js`** 和 **`imageHelper.js`** 中重复定义，维护成本高。
- **建议**：抽取到公共 utils，双向同步。

## 二、健壮性问题

### 4. openid 获取与使用不一致
- `app.js` 的 `getOpenid` 仅写入 `globalData.openid`；
- 但 `index.js:onInsectLongPress` 使用 `wx.getStorageSync('openid')`，**而 app.js 未将其持久化**。若页面状态重建或缓存清空，删除请求会携带 `undefined` 导致权限/删除异常。
- **建议**：`getOpenid` 成功后同步写入 `wx.setStorageSync('openid', ...)`；或统一从 `getApp().globalData` 读取。

### 5. APP 版本号字段不一致（疑似 bug）
- `app.js` 存 `app.globalData.appVersion`；
- `index.js:onLoad` 却读 `app.globalData.version`；
- 导致版本变更永远不触发缓存清除，缓存 version 字段名两边也不匹配。
- **建议**：统一使用单一字段名，如 `appVersion`，并在 `imageHelper.js` 和 `index.js` 保持一致。

### 6. 超时与错误处理硬编码、嵌套深
- `camera.js:confirmSelection` 使用 80s/40s/60s 多层 `setTimeout`，回调嵌套 4~5 层，`this` 引用在 timeout 中容易丢失上下文。代码已经用箭头函数和外部变量缓解，但仍有维护风险。
- **建议**：抽象统一的 `withTimeout(promise, ms, fallback)` 工具函数。

## 三、代码一致性与可维护性

### 7. 日志噪音
- 两处大量残留 `console.log('【调试】...')`、`[调试信息]` 输出。
- **建议**：增加 `const DEBUG = false` 或 `__DEV__` 环境开关，调试日志仅在开发模式打出。

### 8. 图片 URL 获取链路过长
- `getBaiduImageUrl` 会顺序尝试：百度图片搜索 → 专用关键词搜索 → getInsectImages 云函数 → 默认/兜底图。每次冷启动都会产生多次网络请求。
- **建议**：考虑将本地 `IMAGES_CONFIG` 映射表做为首选，仅对未配置的昆虫再走云端；也可在服务端提供批量图片 URL 接口，减少客户端请求次数。

### 9. 缓存策略零散
- 缓存读写穿插在 `try/catch` 和业务逻辑中，且过期策略不统一（等级缓存 24h，图片内存 5min，云知识每次 onShow 刷新）。
- **建议**：封装 `CacheManager.get/set/remove/migrate`，集中处理异常和迁移。

### 10. 测试覆盖可再扩展
- 当前仅对 `insectService` 有单元测试；`imageHelper`、页面生命周期、手势逻辑等仍靠人工回归。
- **建议**：按模块陆续补充 service 层测试。

## 四、用户体验 / 性能观察

- `onShow` 每次强制重拉数据，若用户频繁切 Tab 会产生重复请求；可考虑防抖。
- 分页仅前端去重，若后端数据量大，`loadInsectData` 的 `skip` 性能会下降，可考虑数据库端去重或分片计数。
- 手套兼容性：`wx.createAnimationFrameRequest` 在部分旧基础库中行为可能不同；已有 `scheduleUpdate` 封装，保持即可。

---

## 建议的后续动作（按优先级）

1. **统一 openid / appVersion 字段名**（风险低，收益明确）
2. **抽离 `camera.js` 的图片压缩与保存逻辑**（降低单文件复杂度）
3. **增加 `constants.js` 统一配置和缓存键**（减少散落常量）
4. **抽离 `INSECT_NAME_MAP` 到公共 utils**
5. **增加 `withTimeout` 工具函数**
6. **增加 `DEBUG` 开关控制日志输出**
7. **补充 `imageHelper` 和页面生命周期单测**