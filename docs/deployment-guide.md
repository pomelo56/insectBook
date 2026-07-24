# 昆虫图鉴 - 部署与运维手册

> 最后更新：2026-07-24

## 环境信息

| 配置项 | 值 | 来源 |
|--------|-----|------|
| 云开发环境 ID | `cloud1-8ggzed032ed5ec` | `miniprogram/app.js` + `project.config.json` |
| 小程序名称 | 昆虫手册 / 昆虫图鉴 | PRD.md / app.json |
| 目标平台 | 微信小程序 | — |
| AI 识别模型 | Doubao-Seed-1.6-vision-250815 | 火山方舟 API |

---

## 前置条件

1. 已开通微信云开发服务
2. 已在微信公众平台配置小程序 AppID
3. 已创建云开发环境（ID: `cloud1-8ggzed032ed5ec`）
4. 火山方舟 API Key 已配置（用于 calliNat 云函数）

---

## 本地开发环境搭建

### 1. 克隆项目

```bash
cd /Users/pomelo/WeChatProjects/insectBook
git checkout master
```

### 2. 安装依赖

```bash
# 小程序端（如果使用了 npm 包）
cd miniprogram
npm install

# 云函数依赖需要分别在各云函数目录安装
# 或使用微信开发者工具的「构建 npm」功能
```

### 3. 配置云开发环境变量

在微信开发者工具中：
1. 打开 **云开发控制台** → **云函数** → 找到 `calliNat`
2. 点击 **环境变量**，配置以下变量：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `ARK_API_KEY` | `xxxxxxxxxxxxxxxx` | 火山方舟 API Key（不含 Bearer 前缀） |
| `ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3/` | API 域名（注意末尾斜杠） |
| `MODEL_ID` | `doubao-seed-1-6-vision-250815` | 视觉识别模型 ID |

---

## 部署流程

### 云函数部署

```bash
# 方式一：通过微信开发者工具
# 右键 cloudfunctions/ 目录 → 上传并部署：云端安装依赖

# 方式二：通过命令行（如有 wx-server-sdk-cli）
# 逐个部署或批量部署
```

**部署顺序**：先部署被依赖的云函数，再部署调用方。

| 优先级 | 云函数 | 说明 |
|--------|--------|------|
| P0 | `getOpenId`, `checkAdminPermission` | 认证基础 |
| P1 | `markFound`, `calliNat` | 核心业务 |
| P2 | `getInsectList`, `getInsectDetail`, `getInsectImages` | 数据查询 |
| P3 | `fetchBaiduEncyclopedia`, `baiduImageSearch` | 辅助增强 |
| P4 | `saveBadge`, `deleteBadge`, `getBadgeList` | 管理后台 |
| P5 | `saveFunFact`, `deleteFunFact`, `getFunFactsList` | 内容管理 |
| P6 | `syncInsectData`, `updateInsectImage`, `updateInsectEncyclopedia` | 数据同步 |

### 数据库集合初始化

首次部署后，手动执行一次 `createMissingCollections` 云函数以创建所需集合。

---

## 数据库备份

### 手动导出

1. 微信开发者工具 → **云开发控制台** → **数据库**
2. 依次导出以下集合：
   - `insects`
   - `user_insects`
   - `badges`
   - `fun_facts`
   - `user_stats`
3. 导出为 JSON 格式保存

### 触发备份的时机

- ID 重构前（必须）
- 批量更新徽章配置前
- 每次重大功能发布前

---

## 日志与监控

### 云函数日志级别约定

| 级别 | 用途 |
|------|------|
| `console.log` | 关键业务路径节点（如"识别开始"、"保存成功"） |
| `console.warn` | 非致命异常（如 fallback 到预定义百科） |
| `console.error` | 失败和异常 |

### ⚠️ 禁止事项

1. **不要将 `debugInfo`、`debugLogs` 返回给客户端** — 这是安全风险
2. **不要在生产云函数中输出大量 `console.log`** — 影响性能和成本
3. **不要硬编码 API Key 或 Secret** — 使用云函数环境变量

### 已知 verbose 云函数（需精简）

| 云函数 | console.log 数量 | 建议上限 |
|--------|-----------------|---------|
| fetchBaiduEncyclopedia | 64 | ≤ 5 |
| updateInsectEncyclopedia | 27 | ≤ 5 |
| saveBadge | 19 | ≤ 5 |

---

## 常见问题

### Q: 云函数超时怎么办？

- `calliNat` 识别通常 5-15 秒，前端已设置 80s 总超时
- 如持续超时，检查火山方舟 API 状态或切换备用识别源

### Q: 图片上传失败？

- 检查网络状态
- 检查云存储权限配置
- 确认文件不超过云存储大小限制

### Q: 识别结果不准确？

- 当前使用豆包视觉模型，对常见昆虫准确率较高
- 冷门昆虫可能无法识别，需提供手动输入兜底方案

---

## 分支策略

参考 `CONVENTIONS.md`：

```
master              ← 主线，始终可部署
loop/<N>-<name>     ← 重构循环分支，完成 review 后合并
```

---

*本文档与 `ARCHITECTURE.md` 配合使用。*
