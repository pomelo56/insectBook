# 🪲 昆虫图鉴 (insectBook)

一款微信小程序，帮助用户拍照识别昆虫、记录发现、收集图鉴并学习昆虫知识。

## 功能特性

- 📸 **AI 拍照识别** — 调用豆包视觉 API 自动识别昆虫种类
- 📚 **个人图鉴** — 记录发现的昆虫，展示收集进度和等级徽章
- 🔍 **百科知识** — 自动获取昆虫百科信息，首页轮播冷知识
- 🗺️ **发现地图** — 查看历史发现记录与观察轨迹
- 👨‍💼 **管理后台** — 维护昆虫数据、用户信息和系统配置

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生（Glass Easel 组件框架） |
| 后端 | 微信云开发（云函数 + 云数据库 + 云存储） |
| AI 识别 | 火山方舟 · Doubao Seed 1.6 Vision |
| 测试 | Jest + wx API Mock |
| 方法论 | Loop Engineering / TDD / AI-First |

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 已开通微信云开发服务
- 火山方舟 API Key（用于昆虫识别）

### 本地开发

```bash
# 克隆项目
git clone <repo-url>
cd insectBook

# 使用微信开发者工具打开项目目录
# 确保 project.config.json 中的 cloudfunctionRoot 指向 cloudfunctions/

# 部署云函数
# 在开发者工具中右键 cloudfunctions/ → 上传并部署：云端安装依赖
```

### 云函数环境变量配置

在云开发控制台中为 `calliNat` 云函数配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `ARK_API_KEY` | 火山方舟 API Key（不含 Bearer 前缀） |
| `ARK_BASE_URL` | API 域名，默认 `https://ark.cn-beijing.volces.com/api/v3/` |
| `MODEL_ID` | 模型 ID，默认 `doubao-seed-1-6-vision-250815` |

## 项目结构

```
insectBook/
├── miniprogram/              # 小程序前端
│   ├── pages/                # 主包页面
│   │   ├── index/            # 首页：图鉴列表 + 等级 + 冷知识
│   │   ├── camera/           # 拍照识别页
│   │   ├── admin/            # 管理后台页面组
│   │   └── admin-tools/      # 管理员权限入口
│   ├── subpages/             # 子包页面
│   │   ├── insect-detail/    # 昆虫详情页
│   │   ├── badges/           # 徽章展示
│   │   ├── discovery/        # 发现地图
│   │   └── edit-discovery/   # 编辑发现记录
│   ├── services/             # 业务逻辑层（Service）
│   │   └── insectService.js
│   ├── utils/                # 工具库
│   │   ├── imageHelper.js
│   │   ├── idGenerator.js
│   │   └── insectColdKnowledge.js
│   ├── app.js / app.json / app.wxss
│   └── config.js
├── cloudfunctions/           # 云函数（23 个目录）
│   ├── calliNat/             # AI 识别
│   ├── markFound/            # 保存发现
│   ├── getInsectDetail/      # 昆虫详情
│   ├── getInsectList/        # 昆虫列表
│   ├── fetchBaiduEncyclopedia/ # 百度百科抓取
│   └── ...
├── docs/                     # 项目文档
│   ├── database-schema.md
│   ├── cloud-function-api-contract.md
│   ├── deployment-guide.md
│   ├── ui-navigation.md
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── insect-id-system-refactor.md
│   ├── ENGINEERING-PLAN.md
│   ├── TASKS.json
│   └── task-board.html
├── tests/                    # 单元测试
│   └── unit/insectService.test.js
├── CONVENTIONS.md            # 编码约定
├── PRD.md                    # 产品需求文档
├── CHANGELOG.md              # 版本变更记录
└── README.md                 # 本文件
```

## 文档导航

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求文档：用户画像、功能需求、成功指标 |
| [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) | 目标架构设计：Service 分层、文件行数约束 |
| [CONVENTIONS.md](./CONVENTIONS.md) | 编码约定：命名、require 顺序、Git 分支策略 |
| [database-schema.md](./docs/database-schema.md) | 数据库集合定义与字段说明 |
| [cloud-function-api-contract.md](./docs/cloud-function-api-contract.md) | 云函数 API 契约：入参/出参/错误码 |
| [deployment-guide.md](./docs/deployment-guide.md) | 部署流程、环境变量配置、运维注意事项 |
| [ui-navigation.md](./docs/ui-navigation.md) | 页面路由关系图与导航结构 |
| [ENGINEERING-PLAN.md](./docs/ENGINEERING-PLAN.md) | 重构工程计划（Loop 阶段拆解） |
| [TASKS.json](./docs/TASKS.json) | 机器可读任务看板 |
| [task-board.html](./docs/task-board.html) | Kanban 可视化看板 |

## 当前开发状态

### 已完成 ✅

- [x] Phase 0 L1: AI 基础设施（skills + knowledge）
- [x] Phase 0 L2: 架构文档 + ADR
- [x] Phase 0 L3: 编码约定
- [x] Phase 0 L4: Jest 测试框架
- [x] Phase 0 L5: Vibe coding 遗留清理
- [x] Loop 1-1: 抽离 insectService（index.js 948→794 行）
- [x] 45 个 insectService 单元测试

### 进行中 / 待办 🔄

详见 [ENGINEERING-PLAN.md](./docs/ENGINEERING-PLAN.md) 或打开 [task-board.html](./docs/task-board.html) 查看看板。

核心待办包括：
- Service 拆分（cache / level / knowledge / recognition / imageUpload / save）
- 云函数 23→3 合并
- ID 系统重构（name → externalId）
- Camera.js 瘦身（1189 → <200 行）
- 全面 TDD 回归

## 分支策略

```
master              ← 主线，始终可部署
loop/<N>-<name>     ← 重构循环分支
```

每次重构进入独立分支，完成 review 后合并到 master。

## License

MIT
