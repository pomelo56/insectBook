# 昆虫图鉴 - 领域模型（Ubiquitous Language）

> 最后更新：2026-07-24  
> 目的：确保所有人（人 + AI Agent）使用统一的业务术语，避免重构时语义漂移。

---

## 核心概念

### 昆虫 (Insect)

系统中可识别的昆虫种类条目。是静态参考数据，由管理员维护。

| 属性 | 说明 |
|------|------|
| `name` | 中文名称，如"蓝闪蝶"、"大刀螳螂"——**显示用，不作为 ID** |
| `externalId` | 全局唯一外部标识，格式 `insect_<uuid>`——**业务层唯一 ID** |
| `scientificName` | 学名/拉丁名 |
| `category` | 分类，如"鳞翅目"、"螳螂目" |
| `encyclopedia` | 百科信息对象（description / habitat / food） |
| `imageUrl` | 默认展示图片 URL |
| `recognizeCount` | 被识别总次数 |

**关键规则**：
- 一个 `name` 只对应一条昆虫记录
- 新增昆虫时自动生成 `externalId`
- `name` 可能重复（不同物种同中文名），但 `externalId` 不重复

---

### 发现 (Discovery)

用户通过拍照或手动输入确认看到某只昆虫的行为。**这是用户行为的核心事件**。

| 属性 | 说明 |
|------|------|
| `foundRecords[]` | 每次发现的具体记录数组，包含时间、照片、地点、备注 |
| `foundCount` | 累计发现次数 = foundRecords.length |
| `lastFoundTime` | 最近一次发现的时间 |

**关键规则**：
- 一个用户同种昆虫可以多次发现（每天在公园看到 -> 多次 foundRecords）
- 首页"收集进度"计算的是 **已发现的不同昆虫种类数**，不是发现总次数
- 首次保存发现时 `foundCount = 1`，再次标记同种昆虫时 `foundCount++` 并追加 foundRecord

---

### 图鉴收藏 (Collection)

用户成功标记过的不同昆虫种类。这是首页展示的核心数据。

| 属性 | 说明 |
|------|------|
| `collectedCount` | 已收藏的不同昆虫种类数 |
| `totalCount` | 系统中所有昆虫总数（来自 insects 集合 count） |
| `progressPercent` | `Math.round(collectedCount / totalCount * 100)` |
| `recentInsects` | 最近发现的昆虫列表（分页加载） |

**关键规则**：
- 同名昆虫不会被重复计算收藏（以 `insectExternalId` 为准）
- 删除某条发现记录后，如果该昆虫还有其他发现记录则不计入"未收藏"
- 首页分页加载按 `createdAt desc` 排序

---

### 等级与徽章 (Level & Badge)

根据用户的图鉴收藏数量自动计算的等级成就。

| 等级 | requiredCount | name | levelName |
|------|--------------|------|-----------|
| Lv.1 | 1 | 昆虫萌新 | 入门 |
| Lv.2 | 5 | 昆虫探索者 | 初级 |
| Lv.3 | 15 | 好奇观察者 | 中级 |
| Lv.4 | 30 | 田野侦探 | 高级 |
| Lv.5 | 50 | 昆虫爱好者 | 专家 |

**关键规则**：
- 等级配置存储在 `badges` 集合中，支持动态修改
- 等级计算基于 `collectedCount`（不同昆虫种类数），不是 `totalFoundCount`
- 等级缓存有效期 24 小时

---

### 冷知识 (Fun Fact / Cold Knowledge)

用于首页轮播展示的有趣昆虫知识片段。

| 属性 | 说明 |
|------|------|
| `content` | 冷知识正文 |
| `category` | 分类（生命周期、行为习性等） |
| `relatedInsects[]` | 关联的昆虫名称列表 |
| `seasonalTips[]` | 季节性观察建议 |

**关键规则**：
- 当前数据来源：数据库 `fun_facts` 集合（优先）+ 本地 `insectColdKnowledge.js`（备用）
- 冷知识每 6 秒自动切换
- 冷知识中的昆虫名称用于关联展示，不是引用 externalId

---

### 识别 (Recognition)

用户拍摄/选择图片后，系统通过 AI 判断图中是否为昆虫并返回名称的过程。

**识别流程**：
```
拍照/选图 → 压缩图片 → Base64 → 调用 calliNat 云函数 → 返回 insectName + confidence
```

**关键规则**：
- 识别失败时允许用户手动输入昆虫名称
- 手动输入的置信度固定为 0.95 / 95%
- 识别结果包含：`name`, `confidence`, `scorePercent`, `category`, `baikeInfo`
- 识别结果中的 `baikeInfo` 会作为快照存入 user_insects，之后不再更新

---

### 管理员 (Admin)

拥有后台管理权限的用户。

| 权限范围 | 可操作内容 |
|---------|-----------|
| 昆虫管理 | 增删改 insects 集合、更新百科信息、更新图片 |
| 用户管理 | 查看用户列表和统计 |
| 徽章管理 | 增删改 badges 集合（等级配置） |
| 冷知识管理 | 增删改 fun_facts 集合 |
| 仪表盘 | 查看平台统计概览 |

**关键规则**：
- 管理员身份通过 `checkAdminPermission` 云函数判定
- 非管理员看不到管理入口
- 管理员工具页面 `/pages/admin-tools` 是权限检查页，不是功能页

---

## 业务规则清单

| # | 规则 | 违反时的后果 |
|---|------|-------------|
| R1 | `user_insects.insectExternalId` 引用 `insects.externalId` | 详情页查不到昆虫信息 |
| R2 | 同种昆虫多次发现只增加 foundCount，不创建新 user_insects 记录 | 重复记录污染统计数据 |
| R3 | 首页进度 = distinct insect 种类数 / insects 总数 | 等级计算错误 |
| R4 | markFound 必须先上传照片到云存储，再调云函数写入数据库 | 找不到用户上传的图片 |
| R5 | externalId 格式为 `insect_<uuid>`，不使用 name 作为查询 key | ID 系统混乱、跨用户冲突 |
| R6 | 冷知识优先读数据库，数据库无数据时回退到本地数组 | 首页冷知识区域空白 |
| R7 | 识别超时（15s）后必须给用户"稍后重试"或"手动输入"选项 | 用户卡在识别结果页 |

---

## 名词对照表

| 中文 | English / Code | 说明 |
|------|---------------|------|
| 昆虫 | Insect | insects 集合中的条目 |
| 发现 | Discovery | 用户标记到昆虫的行为 |
| 图鉴收藏 | Collection | 用户已发现的不同昆虫种类 |
| 等级 | Level | 基于收集数量的进阶级别 |
| 徽章 | Badge | 等级对应的荣誉标识 |
| 冷知识 | Fun Fact / Cold Knowledge | 首页轮播的知识片段 |
| 识别 | Recognition | AI 从图片判断昆虫种类 |
| 百科 | Encyclopedia | 昆虫的详细文字介绍 |
| 外部 ID | External ID | `insect_<uuid>` 格式的业务 ID |
| 开放 ID | OpenID | 微信用户的唯一标识 |
| 发现记录 | Found Record | 单次发现的具体详情（时间、照片、地点） |
| 云函数 | Cloud Function | 后端逻辑执行单元 |
