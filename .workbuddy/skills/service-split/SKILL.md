---
name: service-split
description: 从 God Object 拆分 Service 模块的操作手册 — 职责识别、接口定义、依赖注入
version: 1.0
---

# Service 拆分 Skill

## 触发条件
- 从 Page 对象中抽离业务逻辑
- 执行 Loop 1 的模块拆分任务

## 拆分流程

### Step 1: 职责识别
读取当前 Page 的 JS 文件，按关注点分类每个函数：

| 关注点 | 应归入的 Service | 判断依据 |
|--------|----------------|---------|
| 数据库查询（wx.cloud.database / callFunction） | 对应数据 Service | 函数内包含 DB 操作 |
| 缓存读写（wx.setStorageSync / getStorageSync） | cacheService | 函数内包含 Storage 操作 |
| 图片压缩/上传（wx.compressImage / uploadFile） | imageService | 函数内包含图片操作 |
| 识别流程（base64 → 云函数 → 结果解析） | recognitionService | 函数内包含识别逻辑 |
| 保存/上传（markFound → 缓存清理 → UI 更新） | saveService | 函数内包含保存操作 |
| 等级/勋章计算 | levelService | 函数内包含等级判断 |
| 冷知识轮播 | knowledgeService | 函数内包含冷知识逻辑 |
| 管理员权限检查 | adminService | 函数内包含权限逻辑 |

### Step 2: 接口定义
每个 Service 导出清晰的接口函数：

```js
// services/insectService.js
module.exports = {
  getInsectList,       // 获取昆虫列表（含缓存策略）
  getInsectDetail,     // 获取昆虫详情
  searchInsects,       // 搜索昆虫
}
```

**规则**：
- 每个接口函数只做一件事
- 返回 Promise（async/await），不使用回调
- 错误通过 try/catch + 统一 handleError 处理，不散在各处

### Step 3: 依赖注入
Service 之间的依赖通过参数传递，不硬编码引用：

```js
// Page 文件中
const insectService = require('../../services/insectService')
const cacheService = require('../../services/cacheService')

Page({
  onLoad() {
    insectService.getInsectList().then(list => {
      this.setData({ insects: list })
    })
  }
})
```

**Page 文件只做**：
1. `require` Service 模块
2. `this.setData()` 更新 UI
3. `wx.showToast()` 等 UI 反馈
4. 事件分发（点击 → 调用 Service → 更新 UI）

### Step 4: 文件放置
```
miniprogram/
  services/
    insectService.js      — 昆虫数据查询
    cacheService.js       — 统一缓存读写
    levelService.js       — 等级/勋章计算
    knowledgeService.js   — 冷知识轮播
    recognitionService.js — 识别流程
    imageService.js       — 图片压缩/上传
    saveService.js        — 保存流程
    adminService.js       — 管理员权限
    errorHandler.js       — 统一错误处理
```

## 拆分验证标准
- Page 文件 < 200 行
- 每个 Service 文件 < 150 行
- Service 接口有明确的 module.exports
- 无硬编码数据（从 insect-data-schema knowledge 中获取定义）
- 无超过 2 层的嵌套回调（全部用 async/await）

## 禁止事项
- ❌ 不在 Service 里直接操作 this.setData（那是 Page 的职责）
- ❌ 不在 Page 里写数据库查询逻辑（应委托 Service）
- ❌ 不创建超过 5 个函数的 Service（职责太多 = 又是 God Object）
