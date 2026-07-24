# 昆虫图鉴 - 数据库 Schema 文档

> 最后更新：2026-07-24  
> 数据平台：微信小程序云开发（MongoDB）

## 集合总览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   insects       │     │ user_insects    │     │ badges          │
│ (昆虫字典)       │     │ (用户发现记录)    │     │ (徽章配置)       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ _id             │◄──┐ │ _id             │     │ _id             │
│ externalId      │   │ │ _openid         │     │ name            │
│ name            │   │ │ insectExternalId│     │ level           │
│ scientificName  │   │ │ name (冗余)      │     │ levelName       │
│ category        │   │ │ foundCount      │     │ icon            │
│ description     │   │ │ firstFoundTime  │     │ requiredCount   │
│ imageUrl        │   │ │ lastFoundTime   │     │ createdAt       │
│ encyclopedia    │   │ │ userImageUrl    │     │ updatedAt       │
│ recognizeCount  │   │ │ location        │     └─────────────────┘
│ createTime      │   │ │ notes           │
│ updateTime      │   │ │ baikeInfo       │
└─────────────────┘   │ │ foundRecords[]  │
                      │ └─────────────────┘
┌─────────────────┐   ┌─────────────────┐
│ fun_facts       │   │ user_stats      │
│ (冷知识)         │   │ (用户统计)       │
├─────────────────┤   ├─────────────────┤
│ _id             │   │ _id (= openid)  │
│ title           │   │ totalFoundCount │
│ content         │   │ badgeCount      │
│ category        │   │ createdAt       │
│ relatedInsects[]│   │ updatedAt       │
│ seasonalTips[]  │   └─────────────────┘
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

---

## 1. insects — 昆虫字典集合

### 集合用途
存储系统中所有可识别的昆虫基础信息，是用户发现记录的 reference table。

### 字段定义

| 字段 | 类型 | 必填 | 索引 | 说明 |
|------|------|------|------|------|
| `_id` | String | ✅ | 主键 | MongoDB 自动生成的 ObjectId |
| `externalId` | String | ✅ | 唯一索引 | 格式 `insect_<uuid>`，业务层统一使用的 ID |
| `name` | String | ✅ | 普通索引 | 昆虫中文名称（显示用，不作为 ID） |
| `scientificName` | String | ❌ | — | 学名/拉丁名 |
| `category` | String | ❌ | 普通索引 | 分类，如"鳞翅目"、"螳螂目" |
| `description` | String | ❌ | — | 简要描述 |
| `imageUrl` | String | ❌ | — | 昆虫图片 URL |
| `encyclopedia` | Object | ❌ | — | 百科信息对象，见下方嵌套结构 |
| `recognizeCount` | Number | ❌ | — | 被识别次数，默认 0 |
| `createTime` | Date | ✅ | 降序索引 | 创建时间 |
| `updateTime` | Date | ❌ | — | 更新时间 |

### encyclopedia 嵌套结构

```json
{
  "encyclopedia": {
    "description": "蝴蝶是昆虫纲鳞翅目锤角亚目的统称...",
    "habitat": "广泛分布于各种陆地环境",
    "food": "花蜜、树汁等液体食物"
  }
}
```

### 种子数据
- `REAL_DATASET.json` 中提供部分昆虫样例数据

---

## 2. user_insects — 用户发现记录集合

### 集合用途
存储每个用户发现/标记的昆虫记录，是首页图鉴列表的数据来源。

### 字段定义

| 字段 | 类型 | 必填 | 索引 | 说明 |
|------|------|------|------|------|
| `_id` | String | ✅ | 主键 | MongoDB 自动生成 |
| `_openid` | String | ✅ | 自动填充 | 微信用户 OpenID，由云开发自动注入 |
| `insectExternalId` | String | ✅ | 普通索引 | 引用 insects.externalId |
| `name` | String | ✅ | 普通索引 | 昆虫中文名（冗余，便于快速展示） |
| `foundCount` | Number | ✅ | — | 累计发现次数，默认 1 |
| `firstFoundTime` | Date | ✅ | — | 首次发现时间 |
| `lastFoundTime` | Date | ✅ | 降序索引 | 最近一次发现时间 |
| `createdAt` | Date | ✅ | — | 记录创建时间 |
| `updatedAt` | Date | ✅ | — | 记录更新时间 |
| `userImageUrl` | String | ❌ | — | 用户上传照片的 cloudFileID |
| `location` | String | ❌ | — | 发现地点 |
| `notes` | String | ❌ | — | 观察备注 |
| `baikeInfo` | Object | ❌ | — | 识别时获取的百科信息快照 |
| `foundRecords` | Array | ✅ | — | 每次发现的详细记录数组 |

### foundRecords[] 嵌套结构

```json
{
  "foundRecords": [
    {
      "_id": "record_1700000000000_abc123",
      "time": "2025-11-01T12:00:00Z",
      "userImageUrl": "cloud://xxx/photo.jpg",
      "location": "城市公园",
      "description": "在花丛中采蜜",
      "baikeInfo": {}
    }
  ]
}
```

### 索引建议

| 索引 | 字段 | 排序 | 用途 |
|------|------|------|------|
| idx_openid_created | `_openid` + `createdAt` | desc | 首页列表查询 |
| idx_externalId | `insectExternalId` | asc | 详情关联查询 |

---

## 3. badges — 徽章/等级配置集合

### 集合用途
定义用户等级体系，包括等级名称、图标、解锁条件。

### 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | ✅ | MongoDB 主键 |
| `name` | String | ✅ | 徽章名称，如"昆虫萌新" |
| `level` | String | ❌ | 等级标识，如"入门"、"初级" |
| `icon` | String | ✅ | 图标路径，如 `/images/icons/bug1.svg` |
| `requiredCount` | Number | ✅ | 解锁所需发现数量 |
| `createdAt` | Date | ✅ | 创建时间 |
| `updatedAt` | Date | ✅ | 更新时间 |

### 默认等级序列

| level | requiredCount | name |
|-------|--------------|------|
| 1 | 1 | 昆虫萌新 |
| 2 | 5 | 昆虫探索者 |
| 3 | 15 | 好奇观察者 |
| 4 | 30 | 田野侦探 |
| 5 | 50 | 昆虫爱好者 |

---

## 4. fun_facts — 冷知识集合

### 集合用途
存储昆虫冷知识，用于首页轮播展示。

### 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | ✅ | MongoDB 主键 |
| `title` | String | ❌ | 冷知识标题 |
| `content` | String | ✅ | 冷知识正文 |
| `category` | String | ❌ | 分类，如"生命周期"、"行为习性" |
| `relatedInsects` | Array\<String\> | ❌ | 相关昆虫名称列表 |
| `seasonalTips` | Array | ❌ | 季节性观察提示 |
| `createdAt` | Date | ✅ | 创建时间 |
| `updatedAt` | Date | ✅ | 更新时间 |

---

## 5. user_stats — 用户统计表

### 集合用途
聚合统计用户发现总数、徽章数量等，避免每次查询 user_insects 做 count。

### 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | ✅ | = 用户 openid |
| `totalFoundCount` | Number | ✅ | 累计发现数 |
| `badgeCount` | Number | ✅ | 已获得徽章数 |
| `createdAt` | Date | ✅ | 创建时间 |
| `updatedAt` | Date | ✅ | 更新时间 |

---

## 集合间关系

```
insects (1) ──< (N) user_insects (N) ──> (1) user_stats
                            │
                    foundRecords[] (embedded array)

badges (1) ──< (N) user_insects (通过 level 计算关联)
fun_facts (N) ──> insects (通过 relatedInsects[] 名称关联)
```

---

## 注意事项

1. **`externalId` 是未来唯一的业务 ID**：不要使用 name 作为查询 key
2. **`name` 是冗余字段**：`user_insects.name` 冗余存储，用于快速展示，实际关联走 `insectExternalId`
3. **`foundRecords` 是内嵌数组**：每次发现追加一条记录到数组，不使用独立子集合
4. **备份策略**：在 ID 重构前必须导出 full snapshot
