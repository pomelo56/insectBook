---
name: wx-miniprogram
description: 微信小程序开发规范 — API 限制、组件化最佳实践、云开发模式、Page/Component 约定
version: 1.0
---

# 微信小程序开发 Skill

## 触发条件
- 编写/修改 WXML、WXSS、JS 小程序代码
- 设计小程序页面架构或组件拆分
- 调用微信小程序 API 或云开发 API

## 微信小程序核心约束

### 1. 页面生命周期
```js
Page({
  onLoad(options) {},      // 页面加载（只触发一次）
  onShow() {},             // 页面显示（每次切回都触发）
  onReady() {},            // 页面初次渲染完成
  onHide() {},             // 页面隐藏
  onUnload() {}            // 页面卸载
})
```
- **重要**：`onLoad` 只触发一次，`onShow` 每次都触发。缓存刷新逻辑应放 `onShow` 而非 `onLoad`

### 2. 云开发限制
- 云函数单次执行超时：20s（默认），最长 60s
- 云函数并发限制：1000（默认）
- 云数据库单次查询上限：20 条（默认），可设置最多 100
- 云数据库没有自动备份，重要数据需手动导出 JSON 快照
- 云函数之间不能直接调用，需通过 `wx.cloud.callFunction` 间接调用

### 3. 页面导航
- `wx.navigateTo` — 保留当前页，堆栈上限 10 层
- `wx.redirectTo` — 关闭当前页，不堆栈
- `wx.switchTab` — 切换 TabBar 页面（只能切换 app.json 中 tabBar 声明的页面）
- `wx.navigateBack` — 返回上一页

### 4. 组件化规范
- 可复用的 UI 单元必须做成 Component，不是在 Page 里 inline
- Component 通信：
  - 父→子：通过 properties 传数据
  - 子→父：通过 triggerEvent 发事件
- Component 生命周期：`attached` / `detached` / `ready`

### 5. 样式约束
- WXSS 不支持所有 CSS 特性：不支持 `*` 选择器、不支持级联选择器深嵌套
- 尺寸单位优先用 `rpx`（响应式像素），1rpx ≈ 0.5px 在 375 屏幕宽度
- 全局样式放 `app.wxss`，页面级样式放页面目录下
- 组件样式默认隔离（`styleIsolation: 'isolated'`）

### 6. 图片资源
- 本地图片用绝对路径 `/images/xxx.png`
- 网络图片需在 `app.json` 的 `downloadFile` 白名单中声明域名
- SVG 在小程序中通过 `<image>` 标签加载，不支持 inline SVG

## insectBook 项目特定约束

### 数据库集合
- `insects` — 昆虫数据（每条包含 name, externalId, category, images, encyclopedia 等）
- `user_insects` — 用户收集记录（每条包含 openid, insectExternalId, foundAt, count 等）

### 云函数调用模式
```js
// 正确模式：统一错误处理
wx.cloud.callFunction({
  name: 'getInsectDetail',
  data: { externalId: insectId }
}).then(res => {
  if (res.result && res.result.data) {
    // 处理数据
  } else {
    // 处理空结果
  }
}).catch(err => {
  console.error('云函数调用失败:', err)
  wx.showToast({ title: '服务异常', icon: 'error' })
})
```

### async/await 替换回调
```js
// 旧模式（Callback Hell）
setTimeout(() => {
  wx.cloud.callFunction({
    name: 'xxx',
    success: (res) => {
      setTimeout(() => { ... }, 3000)
    },
    fail: (err) => { ... }
  })
}, 5000)

// 新模式（async/await + timeoutWrap）
async function doRecognition() {
  try {
    const result = await timeoutWrap(
      wx.cloud.callFunction({ name: 'xxx', data: {... }),
      60000  // 60s 超时
    )
    // 处理结果
  } catch (err) {
    // 统一错误处理
  }
}
```

## 禁止事项
- ❌ 不在 Page 的 data 里放超过 5 层嵌套的对象
- ❌ 不用 `wx.setStorageSync` 做跨页状态管理（应用 Behavior + globalData）
- ❌ 不在云函数里做超过 2 层嵌套的 setTimeout 回调
- ❌ 不硬编码昆虫数据（应从云数据库读取）
