# insectBook 开工前准备清单

> 基于 Loop Engineering + AI First 原则，从 Vibe Coding 转型 Agentic Engineering 的 5 层 20 项准备体系。
> 生成日期：2026-06-27 | 状态：规划阶段

---

## 一、现状诊断

### 项目扫描结果

| 指标 | 数值 | 说明 |
|------|------|------|
| index.js 行数 | 948 | God Object — 20+ 函数混在单个 Page 对象 |
| camera.js 行数 | 1189 | 3 层嵌套回调地狱 |
| 云函数数量 | 23 | 无统一入口/模式/错误处理 |
| 根级补丁 MD | 12 | CACHE_FIX, WXML_ERROR_FIX, DEPLOY_FIX 等 |
| 根级修补脚本 | 5 | FIX_DATABASE_ISSUES.sh, RUN_COMPLETE_REPAIR.sh 等 |
| 测试覆盖 | 0 | miniprogram 目录下零测试文件 |
| 旧 Claude Code skills | 1 套 | skills/ 目录，Matt Pocock 风格，需迁移 |
| .workbuddy/ | 仅 memory/ | 缺 skills、agents、prompts、knowledge |

### 8 个核心症状

| # | 症状 | 严重度 | 具体表现 |
|---|------|--------|---------|
| 1 | God Object | P0 | index.js 948行、camera.js 1189行，单 Page 对象承担 20+ 函数 |
| 2 | 补丁文档泛滥 | P0 | 12 个根级 MD 修复指南，每个都是对结构性问题的临时补救 |
| 3 | 云函数膨胀 | P1 | 23 个云函数，大量是一次性修补产生 |
| 4 | Callback Hell | P0 | camera.js confirmSelection 有 3 层嵌套超时（最多 80 秒） |
| 5 | 硬编码数据 | P1 | INSECT_SUGGESTIONS、INSECT_NAME_MAP 全部硬编码在 JS 中 |
| 6 | 零测试覆盖 | P0 | 核心路径无任何测试保障 |
| 7 | 重构文档空转 | P1 | insect_id_system_refactor.md 写了方案但未执行 |
| 8 | 关注点混杂 | P0 | 单函数同时做 DB 查询 → 缓存读写 → 图片压缩 → 云函数调用 → UI 更新 |

---

## 二、Vibe Coding vs Agentic Engineering 范式对比

| 维度 | Vibe Coding | Agentic Engineering |
|------|------------|---------------------|
| 输入 | "帮我做一个昆虫识别小程序" | PRD → 架构设计 → 任务分解 |
| 输出 | AI 直接吐代码 | 每个角色独立产出，经质量关卡验证 |
| Bug 处理 | 加补丁文档 + 堆修复代码 | 回退到设计层修复根因 + 测试回归验证 |
| 迭代 | 无结构化迭代，随需求随改 | Loop Engineering: Plan → Build → Test → Review → Merge |
| 质量关卡 | 无 | IS_PASS 审查 + QA 智能路由判定 |
| 文档 | 补丁文档（CACHE_FIX 等） | 架构文档 + 任务列表 + 测试报告 |
| AI 上下文 | 零（agent 无项目知识） | .workbuddy/knowledge + skills + prompts |

---

## 三、Loop Engineering 重构循环模型

### 三个循环

```
Loop 1: 抽离 — 从 God Object 中拆出独立模块
Loop 2: 规范化 — 建立统一架构约定
Loop 3: 闭环 — 测试覆盖 + 验证
```

### Loop 1: 抽离（最关键）

**index.js (948行) → 拆为 5 个模块：**
- `services/insectService.js` — 昆虫数据查询（DB → 缓存策略）
- `services/levelService.js` — 等级/徽章计算逻辑
- `services/knowledgeService.js` — 冷知识加载和轮播
- `services/cacheService.js` — 统一缓存读写（替代散布各处的 wx.setStorageSync）
- `services/adminService.js` — 管理员权限检查

**camera.js (1189行) → 拆为 3 个模块：**
- `services/recognitionService.js` — 识别流程（压缩 → base64 → 云函数调用）
- `services/imageService.js` — 图片压缩/上传
- `services/saveService.js` — 保存流程（上传 → markFound → 缓存清理）

**23 个云函数 → 合并为 3 类统一入口：**
- `insectApi` — 昆虫相关（getInsectList, getInsectDetail, getInsectImages, fetchBaiduEncyclopedia）
- `userApi` — 用户相关（markFound, getOpenId, getUserOpenid, getUserList, checkAdminPermission）
- `adminApi` — 管理相关（saveBadge, deleteBadge, getBadgeList, saveFunFact, deleteFunFact, getFunFactsList）

**Loop 1 闭环验证**：每个页面文件控制在 < 200行，Page 只做 UI 绑定和事件分发，业务逻辑全部委托 Service。

### Loop 2: 规范化

- 执行 insect_id_system_refactor.md — ID 重构方案落地 externalId
- 统一状态管理 — Store 模式替代散布的 wx.setStorageSync
- async/await 替换回调 — 统一 timeoutWrap() 工具函数
- 统一错误处理 — 一个 handleError() 替代各 Page 不同 try/catch 策略
- 清除补丁文档 — 结构性问题修复后不再需要

**Loop 2 闭环验证**：所有跨模块调用通过统一接口，无硬编码映射表，无回调嵌套超过 2 层。

### Loop 3: 闭环

- 核心 service 模块单元测试（insectService、levelService、recognitionService）
- 云函数集成测试（insectApi/userApi/adminApi）
- E2E 验收流程：拍照识别 → 保存 → 首页展示 → 删除

**Loop 3 闭环验证**：测试覆盖率 ≥ 60% 核心路径，全部通过后合并。

---

## 四、5 层准备体系（严格执行顺序）

### 依赖链

```
L5(清理遗留) → L1(AI基础设施) → L2(设计文档) → L3(编码约定) → L4(测试基础) → Loop 1(开工)
```

> 每层必须完成后才能进入下一层，否则就是另一种 vibe coding。

---

### L1: AI First 基础设施 (.workbuddy/)

**开工前必须完成。** 这是 AI agent 的"标准作业程序"——没有 skills 的 agent = 没有 SOP 的工人 → 回到 vibe coding。

#### skills/

| Skill | 文件 | 说明 |
|-------|------|------|
| loop-engineering | `loop-engineering/SKILL.md` | Loop Engineering 工作流：Plan → Build → Test → Review 循环执行 |
| wx-miniprogram | `wx-miniprogram/SKILL.md` | 微信小程序开发规范：API 限制、生命周期、组件化 |
| service-split | `service-split/SKILL.md` | God Object → Service 拆分模式：职责识别、接口定义、依赖注入 |

#### agents/

| Agent | 文件 | 说明 |
|-------|------|------|
| refactor-architect | `refactor-architect.yaml` | 重构架构师：读取现有代码结构 → 输出拆分方案 |
| wx-engineer | `wx-engineer.yaml` | 微信小程序工程师：按 Service 模式编写代码 |
| cloud-fn-merger | `cloud-fn-merger.yaml` | 云函数合并专用：23 → 3 统一入口 |

#### prompts/

| Prompt | 文件 | 说明 |
|--------|------|------|
| service-extract | `service-extract.md` | 从 Page 对象抽离 Service 的详细指令模板 |
| async-convert | `async-convert.md` | callback → async/await 转换指令模板 |
| cloud-fn-merge | `cloud-fn-merge.md` | 云函数合并指令模板 |

#### knowledge/

| Knowledge | 文件 | 说明 |
|-----------|------|------|
| architecture-decisions | `architecture-decisions.md` | ADR 汇总：已做的架构决策，避免重复争论 |
| wx-api-reference | `wx-api-reference.md` | 微信小程序 API 参考：生命周期、路由、存储 |
| insect-data-schema | `insect-data-schema.md` | 昆虫数据结构定义：字段、关系、ID 策略 |

---

### L2: 架构与设计文档 (docs/)

**Loop 0: 规划阶段产出。** 架构师需要产出作为工程师的输入。

#### docs/architecture/

| 文件 | 说明 |
|------|------|
| `ARCHITECTURE.md` | 系统架构全景：模块划分、数据流、接口定义 |
| `ADR-001-id-refactor.md` | ID 重构决策（基于已有 insect_id_system_refactor.md 落地） |
| `ADR-002-service-layer.md` | Service 层引入决策：为什么拆、怎么拆、约束规则 |
| `ADR-003-cloud-fn-merge.md` | 云函数合并决策：23 → 3 的合并策略和接口设计 |
| `class-diagram.mmd` | 类图（Mermaid 格式）：Service 类关系 |
| `sequence-camera.mmd` | 拍照识别时序图：用户操作 → 图片压缩 → 云函数 → 结果展示 |

#### docs/loops/

| 文件 | 说明 |
|------|------|
| `loop-1-extract/PLAN.md` | Loop 1 抽离计划：目标、范围、验证标准 |
| `loop-1-extract/TASKS.md` | Loop 1 任务列表：有序、含依赖、按实现顺序排列 |
| `loop-2-normalize/PLAN.md` | Loop 2 规范化计划 |
| `loop-2-normalize/TASKS.md` | Loop 2 任务列表 |
| `loop-3-close/PLAN.md` | Loop 3 闭环计划 |
| `loop-3-close/TASKS.md` | Loop 3 任务列表 |

#### docs/prd/

| 文件 | 说明 |
|------|------|
| `PRD-incremental.md` | 增量 PRD：基于现有 PRD + 重构需求，仅描述变更部分 |
| `CHANGELOG.md` | 变更记录：每个 Loop 完成后追加 |

---

### L3: 编码约定与配置

**Loop 0: 规范定义。** 工程师需要统一的编码标准。

#### CONVENTIONS.md

```
文件命名: camelCase Service (insectService.js)
函数命名: 动词+名词 (getInsectById, markInsectFound)
最大行数: 200行/文件（超出即拆分）
错误处理: 统一 handleError()，不允许各 Page 自行 try/catch
缓存策略: 通过 cacheService 统一读写，禁止直接 wx.setStorageSync
状态管理: 通过 store.js 统一，禁止散布的 globalData 操作
异步模式: async/await + timeoutWrap()，禁止超过 2 层回调嵌套
云函数调用: 通过统一入口 (insectApi/userApi/adminApi)，禁止直接 wx.cloud.callFunction
```

#### .editorconfig

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
max_line_length = 120
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

---

### L4: 测试基础设施 (tests/)

**Loop 1 启动前。** 每个 Loop 完成后必须有测试验证。

#### 目录结构

```
tests/
  unit/
    insectService.test.js
    levelService.test.js
    recognitionService.test.js
    cacheService.test.js
    imageService.test.js
  integration/
    insectApi.test.js
    userApi.test.js
    adminApi.test.js
  jest.config.js
```

#### jest.config.js 关键配置

- 测试覆盖率目标: ≥ 60%（核心路径）
- mock wx API（miniprogram-simulate 或自建 mock）
- 测试运行脚本: `npm test`
- 测试文件命名: `*.test.js`
- 测试目录: `tests/unit/` + `tests/integration/`

---

### L5: 清理 — 删除 vibe coding 遗留

**Loop 0 开始时执行。** 不清理 = 新架构会被旧补丁干扰。

#### 删除 12 个补丁 MD

| 文件 | 说明 | 处理 |
|------|------|------|
| CACHE_CLEAR_INSTRUCTIONS.md | 缓存清除指南 | 删除（Loop 2 统一缓存后不再需要） |
| CACHE_FIX_GUIDE.md | 缓存修复指南 | 删除（同上） |
| DEPLOY_INSECT_DETAIL_FIX.md | 部署修复 | 删除（云函数合并后不再需要） |
| FIX_DATABASE_ISSUES.sh | 数据库修复脚本 | 删除（ID 重构后不再需要） |
| README_CDN.md | CDN 图片修复 | 删除（架构统一后不再需要） |
| README_IMAGES_FIX.md | 图片修复 | 删除（同上） |
| SIMPLE_STYLE_FIX_GUIDE.md | 样式修复 | 删除（组件化后不再需要） |
| STYLE_REFRESH_DEPLOYMENT_GUIDE.md | 样式部署 | 删除（同上） |
| TESTING_GUIDE.md | 测试指南 | 删除（jest.config.js 替代） |
| WXML_COMPILATION_ERROR_FIX.md | WXML 编译修复 | 删除（模块化后不再需要） |
| insect_id_system_refactor.md | ID 重构方案 | **迁移到 docs/architecture/ADR-001-id-refactor.md** |
| RUN_COMPLETE_REPAIR.sh | 全量修复脚本 | 删除 |

#### 删除 5 个修补脚本

- FIX_DATABASE_ISSUES.sh
- RUN_COMPLETE_REPAIR.sh
- deploy_calliNat.sh
- deploy_getInsectDetail.sh
- deploy_initialize_db.sh

#### 迁移旧 skills 目录

| 操作 | 说明 |
|------|------|
| 评估 skills/ 目录 | 读取 Matt Pocock skills 集合，识别有价值内容 |
| 提取精华 | tdd/、improve-codebase-architecture/ 等有价值 skill → 迁移到 .workbuddy/skills/ |
| 删除过时 | deprecated/ 下的 skill → 直接删除 |
| 删除原始目录 | 迁移完成后删除 skills/ 目录 |

---

## 五、重构后目标目录结构

```
insectBook/
  .workbuddy/                  # AI First 基础设施
    memory/                    # 已有：项目记忆
      MEMORY.md
      YYYY-MM-DD.md
    skills/                    # 新建：项目级 Skill
      loop-engineering/
      wx-miniprogram/
      service-split/
    agents/                    # 新建：项目级 Agent 配置
      refactor-architect.yaml
      wx-engineer.yaml
      cloud-fn-merger.yaml
    prompts/                   # 新建：项目级 Prompt 模板
      service-extract.md
      async-convert.md
      cloud-fn-merge.md
    knowledge/                 # 新建：项目知识库
      architecture-decisions.md
      wx-api-reference.md
      insect-data-schema.md

  docs/                        # 新建：架构与设计文档
    architecture/
      ARCHITECTURE.md
      ADR-001-id-refactor.md
      ADR-002-service-layer.md
      ADR-003-cloud-fn-merge.md
      class-diagram.mmd
      sequence-camera.mmd
    loops/
      loop-1-extract/
        PLAN.md
        TASKS.md
      loop-2-normalize/
        PLAN.md
        TASKS.md
      loop-3-close/
        PLAN.md
        TASKS.md
    prd/
      PRD-incremental.md
      CHANGELOG.md

  miniprogram/                 # 重构后源码
    pages/                     # 已有（瘦身到 <200行）
      index/                   # 948行 → ~150行
      camera/                  # 1189行 → ~120行
      insect-detail/
      admin/
    services/                  # 新建：业务逻辑层
      insectService.js
      levelService.js
      knowledgeService.js
      cacheService.js
      recognitionService.js
      imageService.js
      saveService.js
      adminService.js
    utils/                     # 新建：工具层
      asyncUtil.js
      errorHandler.js
      timeoutWrap.js
      validate.js
      formatUtil.js
      dateUtil.js
      logUtil.js
    store/                     # 新建：状态管理层
      store.js
      behavior.js
    components/                # 已有：公共组件（保持）

  cloudfunctions/              # 重组：23 → 3
    insectApi/
    userApi/
    adminApi/

  tests/                       # 新建：测试基础设施
    unit/
    integration/
    jest.config.js

  CONVENTIONS.md               # 新建：编码约定
  .editorconfig                # 新建：编辑器配置
  PRD.md                       # 已有：原始 PRD（保留作为参考）
  app.json                     # 已有：小程序配置
  project.config.json          # 已有：项目配置
```

---

## 六、增量重构执行路径（推荐方案 A）

```
Loop 0: L5(清理) → L1(AI基础) → L2(设计文档) → L3(约定) → L4(测试)
Loop 1-1: 拆 insectService (从 index.js) → 测试 → merge
Loop 1-2: 拆 levelService (从 index.js) → 测试 → merge
Loop 1-3: 拆 recognitionService (从 camera.js) → 测试 → merge
Loop 1-4: 合并云函数为 3 类入口 → 测试 → merge
Loop 2-1: 执行 ID 重构方案 → 数据迁移 → 测试 → merge
Loop 2-2: async/await 替换回调 → 测试 → merge
Loop 2-3: 统一错误处理 → 删除补丁文档 → 测试 → merge
Loop 3:  测试覆盖 + E2E 验收
```

---

## 七、铁律

1. **不再补丁** — 发现结构性 Bug → 回退到架构层修复，不写 CACHE_FIX_GUIDE.md
2. **每个改动有测试护航** — 没有测试的改动不合并
3. **模块边界明确** — 每个文件只负责一件事，超过 200 行即拆分
4. **信息流经质量关卡** — PRD → 架构 → 代码 → 测试，每步有 IS_PASS 审查
5. **AI First** — .workbuddy/ 中的 skills + knowledge 是 agent 的 SOP，不是装饰
