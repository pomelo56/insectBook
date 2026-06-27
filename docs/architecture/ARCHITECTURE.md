# insectBook 重构架构设计

> 基于 Loop Engineering Phase 1-3 的目标架构
> 来源：vibe coding 诊断 + ENGINEERING-PLAN.md

## 目标架构概览

```
miniprogram/
  app.js                    — 入口（云开发初始化 + globalData）
  app.json                  — 页面路由 + tabBar + 云开发环境配置
  app.wxss                  — 全局样式（设计系统 Token）
  config.js                 — 环境配置（API key、云环境ID）

  services/                  — 业务逻辑层（从 Page 中抽离）
    insectService.js         — 昆虫数据查询（列表/详情/搜索）
    cacheService.js          — 统一缓存读写（替代散布各处的 wx.setStorageSync）
    levelService.js          — 等级/勋章计算
    knowledgeService.js      — 冷知识轮播
    recognitionService.js    — 识别流程（压缩→base64→云函数→结果）
    imageService.js          — 图片压缩/上传
    saveService.js           — 保存流程（markFound→缓存清理→UI更新）
    adminService.js          — 管理员权限检查
    errorHandler.js          — 统一错误处理（替代散布各处的 try/catch）

  pages/
    index/                   — 首页（昆虫网格 + 冷知识 + 等级展示）
      index.js               — < 200行：UI绑定 + 事件分发
      index.wxml
      index.wxss
      index.json
    camera/                  — 拍照识别
      camera.js              — < 200行
      camera.wxml
      camera.wxss
      camera.json

  subpages/
    insect-detail/           — 昆虫详情
    badges/                  — 勋章展示
    discovery/               — 发现记录
    edit-discovery/          — 编辑发现

  pages/admin/               — 管理后台
    dashboard/
    insects/
    badges/
    fun-facts/
    users/

  components/                — 可复用UI组件（Loop 2 从 Page 中抽离）
    insect-card/             — 昆虫卡片
    level-badge/             — 等级徽章
    fun-fact-card/           — 冷知识卡片

  utils/
    idGenerator.js           — ID生成器
    imageHelper.js           — 图片辅助
    timeoutWrap.js           — async 超时包装（替代手动 setTimeout）
    insectColdKnowledge.js   — 冷知识数据（Loop 2 后迁移到数据库）

  images/                    — 图片资源

cloudfunctions/
  insectApi/                 — 昆虫相关（7个action路由）
    index.js
    handlers/
      getInsectList.js
      getInsectDetail.js
      getInsectImages.js
      fetchEncyclopedia.js
      searchImages.js
      updateImage.js
      updateEncyclopedia.js

  userApi/                   — 用户相关（4个action路由）
    index.js
    handlers/
      markFound.js
      getOpenId.js
      getOpenid.js
      getUserList.js

  adminApi/                  — 管理相关（7个action路由）
    index.js
    handlers/
      saveBadge.js
      deleteBadge.js
      getBadgeList.js
      saveFunFact.js
      deleteFunFact.js
      getFunFactsList.js
      checkPermission.js

  _archive/                  — 旧云函数归档（不直接删除）
    (23个原云函数目录)
```

## 数据流

```
用户操作 → Page(事件分发) → Service(业务逻辑) → 云函数/数据库 → Service(数据处理) → Page(setData更新UI)
```

每个环节只做自己的事：
- Page: UI 绑定 + 事件分发
- Service: 业务逻辑 + 数据处理
- 云函数: 数据库操作 + 第三方 API 调用

## 文件行数目标

| 文件类型 | 当前 | 目标 |
|---------|------|------|
| index.js | 948行 | < 200行 |
| camera.js | 1189行 | < 200行 |
| 每个 Service | 不存在 | < 150行 |
| 每个云函数 | 30-80行/个 | index.js < 50行 + handlers 拆分 |
| 每个 WXSS | 300-550行 | < 100行（组件化后自然拆分） |
