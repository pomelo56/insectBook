---
name: insect-data-schema
description: insectBook 数据结构定义 — 昆虫数据、用户收集记录、ID 系统、等级和勋章
version: 1.0
type: knowledge
---

# insectBook 数据结构定义

## 昆虫集合 (insects)

每条昆虫记录的字段定义：

```json
{
  "_id": "自动生成的记录ID",
  "externalId": "insect-001",           // 外部唯一标识（重构目标：替代 name 做 ID）
  "name": "七星瓢虫",                   // 昆虫名称
  "category": "鞘翅目",                 // 分类
  "description": "...",                  // 描述文字
  "images": ["url1", "url2"],            // 图片URL列表
  "encyclopedia": {                      // 百度百科数据
    "title": "...",
    "summary": "...",
    "url": "..."
  },
  "funFacts": ["冷知识1", "冷知识2"],    // 冷知识列表
  "rarity": "common",                    // 稀有度: common/uncommon/rare/legendary
  "level": 1                             // 等级（1-5）
}
```

**重要**：当前代码用 `name` 做 ID 查询昆虫，这是 vibe coding 的硬编码问题。重构后全部改用 `externalId`。

## 用户收集集合 (user_insects)

```json
{
  "_id": "自动生成",
  "openid": "用户的微信openid",
  "insectExternalId": "insect-001",      // 关联昆虫的外部ID
  "foundAt": "2026-06-27T10:00:00Z",     // 发现时间
  "count": 1,                            // 发现次数
  "imageUrl": "...",                      // 用户拍照的图片URL
  "recognizedFrom": "camera"              // 来源: camera/manual
}
```

## 等级系统

当前硬编码在 index.js 中，重构后应从数据库或配置文件读取：

| 等级 | 名称 | 所需发现数 |
|------|------|-----------|
| 1 | 昆虫新手 | 0 |
| 2 | 昆虫爱好者 | 5 |
| 3 | 昆虫观察家 | 15 |
| 4 | 昆虫专家 | 30 |
| 5 | 昆虫大师 | 50 |

## 勋章系统

```json
{
  "_id": "自动生成",
  "name": "首次发现",
  "description": "发现第一只昆虫",
  "icon": "/images/badges/first-find.png",
  "condition": { "type": "count", "threshold": 1 }
}
```

## 冷知识轮播

当前硬编码在 `miniprogram/utils/insectColdKnowledge.js`，重构后应从数据库读取：

```json
{
  "_id": "自动生成",
  "insectExternalId": "insect-001",
  "text": "七星瓢虫一天能吃掉100只蚜虫",
  "source": "百度百科"
}
```

## ID 系统重构方案

来自 `docs/architecture/insect-id-system-refactor.md`：

1. 所有昆虫记录新增 `externalId` 字段（格式: `insect-{sequential-number}`）
2. 所有查询从 `name` 改为 `externalId`
3. `INSECT_NAME_MAP` 等硬编码映射表删除，改用云数据库查询
4. 数据迁移脚本：`migrate_insect_ids.js`（已存在但未执行）

## 禁止事项
- ❌ 不用 `name` 做 ID 查询（应使用 `externalId`）
- ❌ 不在代码中硬编码昆虫列表（应从 insects 集合动态查询）
- ❌ 不在代码中硬编码等级/勋章配置（应从配置文件或数据库读取）
