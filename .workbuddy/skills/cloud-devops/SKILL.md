---
name: cloud-devops
description: 微信小程序云开发运维 — 云函数部署、合并策略、数据库操作、环境管理
version: 1.0
---

# 云开发运维 Skill

## 触发条件
- 修改/创建/合并云函数
- 操作云数据库
- 部署云函数到微信云开发环境

## 云函数合并策略

当前 23 个云函数 → 合并为 3 类统一入口：

### insectApi（昆虫相关）
| 原函数名 | 新接口名 | 功能 |
|----------|---------|------|
| getInsectList | insectApi.getInsectList | 获取昆虫列表 |
| getInsectDetail | insectApi.getInsectDetail | 获取昆虫详情 |
| getInsectImages | insectApi.getInsectImages | 获取昆虫图片 |
| fetchBaiduEncyclopedia | insectApi.fetchEncyclopedia | 拉百科数据 |
| baiduImageSearch | insectApi.searchImages | 百度图片搜索 |
| updateInsectImage | insectApi.updateImage | 更新昆虫图片 |
| updateInsectEncyclopedia | insectApi.updateEncyclopedia | 更新百科数据 |

### userApi（用户相关）
| 原函数名 | 新接口名 | 功能 |
|----------|---------|------|
| markFound | userApi.markFound | 标记发现 |
| getOpenId | userApi.getOpenId | 获取OpenID |
| getUserOpenid | userApi.getOpenid | 获取openid |
| getUserList | userApi.getUserList | 获取用户列表 |

### adminApi（管理相关）
| 原函数名 | 新接口名 | 功能 |
|----------|---------|------|
| saveBadge | adminApi.saveBadge | 保存勋章 |
| deleteBadge | adminApi.deleteBadge | 删除勋章 |
| getBadgeList | adminApi.getBadgeList | 勋章列表 |
| saveFunFact | adminApi.saveFunFact | 保存冷知识 |
| deleteFunFact | adminApi.deleteFunFact | 删除冷知识 |
| getFunFactsList | adminApi.getFunFactsList | 冷知识列表 |
| checkAdminPermission | adminApi.checkPermission | 权限检查 |

## 合并后的云函数结构

```
cloudfunctions/
  insectApi/
    index.js       — 统一入口，根据 action 参数路由到不同处理函数
    config.json
    package.json
  userApi/
    index.js
    config.json
    package.json
  adminApi/
    index.js
    config.json
    package.json
```

### 统一入口模式
```js
// cloudfunctions/insectApi/index.js
exports.main = async (event, context) => {
  const { action, data } = event
  const handlers = {
    getInsectList: handleGetInsectList,
    getInsectDetail: handleGetInsectDetail,
    getInsectImages: handleGetInsectImages,
    fetchEncyclopedia: handleFetchEncyclopedia,
    searchImages: handleSearchImages,
    updateImage: handleUpdateImage,
    updateEncyclopedia: handleUpdateEncyclopedia,
  }
  
  const handler = handlers[action]
  if (!handler) {
    return { code: 400, message: `Unknown action: ${action}` }
  }
  
  try {
    const result = await handler(data, context)
    return { code: 0, data: result }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
```

## 云数据库操作规范

### 查询
```js
const db = wx.cloud.database()
// 单条查询
const res = await db.collection('insects').where({ externalId: id }).get()
// 分页查询
const res = await db.collection('insects').skip(offset).limit(20).get()
```

### 写入
```js
// 新增
await db.collection('insects').add({ data: {...} })
// 更新
await db.collection('insects').doc(recordId).update({ data: {...} })
```

### 安全规则
- `insects` 集合：所有人可读，仅管理员可写
- `user_insects` 集合：每个人只能读写自己的数据

## 部署流程
1. 在微信开发者工具中右键云函数 → "上传并部署：云端安装依赖"
2. 确认环境ID与 app.js 中的云开发环境一致
3. 测试验证每个 action 是否正常返回

## 禁止事项
- ❌ 不直接删除旧云函数（应先归档到 `_archive/`，确认新函数替代后再删）
- ❌ 不在云函数里做超过 60s 的操作
- ❌ 不把所有 23 个函数的逻辑堆在一个 index.js 里（应拆为 handler 函数）
