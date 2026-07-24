# 昆虫图鉴 - 云函数 API 契约文档

> 最后更新：2026-07-24  
> 约定：所有云函数统一入口格式为 `wx.cloud.callFunction({ name, data })`

## 调用约定

```javascript
// 通用调用模板
const result = await wx.cloud.callFunction({
  name: '<cloud_function_name>',
  data: { /* action params */ }
});

if (result.result.success) {
  // 成功处理
} else {
  // 错误处理
}
```

---

## Insect API（insects / user_insects）

### 1. getInsectList

| 项目 | 说明 |
|------|------|
| **用途** | 获取昆虫列表（支持搜索、过滤、分页） |
| **入参** | `{ pageNum?: number, pageSize?: number, searchKey?: string, filter?: 'all'\|'noImage'\|'hasImage', sortBy?: string, sortOrder?: 'asc'\|'desc' }` |
| **出参** | `{ success: true, insects: Array, total: number, pageNum: number, pageSize: number, hasMore: boolean }` |
| **insects[]** | `{ id, externalId, name, category, scientificName, imageUrl, recognizeCount, createTime, description }` |
| **错误码** | `{ success: false, error: string }` |

### 2. getInsectDetail

| 项目 | 说明 |
|------|------|
| **用途** | 获取昆虫详细信息（百科 + 统计） |
| **入参** | `{ insectId?: string, insectName?: string }` |
| **出参** | `{ success: true, name, description, habitat, food, category, source, externalId, foundCount, lastFoundDate, imageUrl, encyclopedia, createTime, recognitionCount }` |
| **source** | `'database' \| 'predefined' \| 'generated' \| 'error_fallback'` |
| **降级策略** | 即使出错也返回 `success: true` + fallback 内容，确保前端不白屏 |

### 3. markFound

| 项目 | 说明 |
|------|------|
| **用途** | 标记/保存/删除用户昆虫发现记录 |
| **入参** | `{ action: 'save'\|'delete', name?, userImageUrl?, baikeInfo?, insectId?, clientTimestamp?, location?, description? }` |
| **出参(save)** | `{ success: true, message: '保存成功', data: { name, insectId }, userInfo: { openid, totalFound } }` |
| **出参(delete)** | `{ success: true, message: '删除成功', data: { insectId } }` |
| **副作用** | save 时会新增一条 foundRecords 条目，并尝试触发数据同步 |

### 4. getInsectImages

| 项目 | 说明 |
|------|------|
| **用途** | 获取昆虫图片 URL 列表 |
| **入参** | `{ keyword: string }` |
| **出参** | `{ success: true, images: Array<{ url, title }> }` |

---

## User API（用户认证 / 权限 / 统计）

### 5. getOpenId / getOpenid

| 项目 | 说明 |
|------|------|
| **用途** | 获取当前用户 OpenID |
| **入参** | 无 |
| **出参** | `{ success: true, openid: string }` |

> ⚠️ `getOpenId` 和 `getOpenid` 是两个不同的云函数目录，功能相同，建议合并。

### 6. getUserList

| 项目 | 说明 |
|------|------|
| **用途** | 管理员获取用户列表 |
| **入参** | `{ pageNum?: number, pageSize?: number }` |
| **出参** | `{ success: true, users: Array, total: number }` |

### 7. checkAdminPermission

| 项目 | 说明 |
|------|------|
| **用途** | 检查当前用户是否为管理员 |
| **入参** | `{ mode: 'getOpenid' }` |
| **出参** | `{ success: true, isAdmin: boolean, openid: string, message: string, configuredAdmins: number, isConfigured: boolean, howToBecomeAdmin: string }` |

---

## Recognition API（识别 / 图像）

### 8. calliNat

| 项目 | 说明 |
|------|------|
| **用途** | AI 昆虫识别（豆包视觉 API） |
| **入参** | `{ imageBase64: string }` |
| **出参** | `{ success: true, isRecognized: boolean, insectName: string, confidence: string, scorePercent: string, category: string }` |
| **环境变量** | `ARK_API_KEY`, `ARK_BASE_URL`, `MODEL_ID` |

### 9. baiduImageSearch

| 项目 | 说明 |
|------|------|
| **用途** | 百度图片搜索（用于获取昆虫配图） |
| **入参** | `{ keyword: string }` |
| **出参** | `{ success: true, images: Array }` |

### 10. fetchBaiduEncyclopedia

| 项目 | 说明 |
|------|------|
| **用途** | 从百度百科抓取昆虫百科内容 |
| **入参** | `{ keyword: string }` |
| **出参** | `{ success: true, content: string, keyword: string, isMockData: boolean }` |
| **⚠️ 注意** | 当前实现会返回 `debugInfo` 给客户端，重构时应移除 |

---

## Admin API（管理后台）

### 11. saveBadge

| 项目 | 说明 |
|------|------|
| **用途** | 添加/更新徽章配置 |
| **入参** | `{ name, level, icon, requiredCount, _id? }` |
| **出参** | `{ success: true, badgeId: string }` |

### 12. deleteBadge

| 项目 | 说明 |
|------|------|
| **用途** | 删除徽章配置 |
| **入参** | `{ _id: string }` |
| **出参** | `{ success: true }` |

### 13. getBadgeList

| 项目 | 说明 |
|------|------|
| **用途** | 获取所有徽章配置 |
| **入参** | `{ pageNum?: number, pageSize?: number }` |
| **出参** | `{ success: true, badges: Array, total: number }` |

### 14. saveFunFact / saveFunFactSimple

| 项目 | 说明 |
|------|------|
| **用途** | 添加/更新冷知识 |
| **入参** | `{ content, category?, relatedInsects? }` |
| **出参** | `{ success: true, factId: string }` |

> ⚠️ `saveFunFact` 和 `deleteFunFact` 目录存在但未被调用，实际使用的是 `saveFunFactSimple` / `deleteFunFactSimple`。

### 15. deleteFunFact / deleteFunFactSimple

| 项目 | 说明 |
|------|------|
| **用途** | 删除冷知识 |
| **入参** | `{ _id: string }` |
| **出参** | `{ success: true }` |

### 16. getFunFactsList

| 项目 | 说明 |
|------|------|
| **用途** | 获取冷知识列表 |
| **入参** | `{ pageNum?: number, pageSize?: number }` |
| **出参** | `{ success: true, funFacts: Array, total: number }` |

### 17. updateInsectImage

| 项目 | 说明 |
|------|------|
| **用途** | 更新昆虫图片 URL |
| **入参** | `{ insectId, imageUrl }` |
| **出参** | `{ success: true }` |

### 18. updateInsectEncyclopedia

| 项目 | 说明 |
|------|------|
| **用途** | 更新昆虫百科信息 |
| **入参** | `{ insectId, encyclopedia: Object }` |
| **出参** | `{ success: true }` |

---

## 一次性脚本（不应由小程序调用）

| 云函数 | 用途 | 是否生产调用 |
|--------|------|-------------|
| `fillRealData` | 填充真实种子数据 | ❌ 仅初始化时执行 |
| `createMissingCollections` | 创建缺失的数据库集合 | ❌ 仅初始化时执行 |
| `migrateInsectExternalIds` | 迁移 ID 系统 | ❌ 仅在 ID 重构时执行 |

---

## 待合并的统一入口（重构目标）

```
insectApi/index.js  → { action: 'list'|'detail'|'images'|'sync'|'updateImage'|'updateEncyclopedia'|'fetchEncyclopedia' }
userApi/index.js    → { action: 'getOpenId'|'getUserList'|'checkPermission'|'markFound'|'recognition' }
adminApi/index.js   → { action: 'badgeSave'|'badgeDelete'|'badgeList'|'funFactSave'|'funFactDelete'|'funFactList' }
```
