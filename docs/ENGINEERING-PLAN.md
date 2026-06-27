# insectBook 重构工程计划

> 版本：v2.0 | 日期：2026-06-27 | 状态：Phase 0 L5 已完成，进入 L1
> 方法论：Loop Engineering + AI First + Agentic Engineering
> 团队：4 角色（PM 许清楚 / 架构师 高见远 / 工程师 寇豆码 / QA 严过关）
> 回滚机制：Git baseline commit `6e532e8` + cleanup commit `6951627` — `git checkout 6e532e8` 可随时回退到 vibe coding 原状态

---

## 〇、总览

```
Phase 0: 准备（5 层）       ← L5 已完成✓，现在进入 L1
Phase 1: Loop 1 抽离         ← 最关键的重构循环
Phase 2: Loop 2 规范化       ← 统一架构约定
Phase 3: Loop 3 闭环         ← 测试覆盖 + 验收
```

**回滚机制**：Git baseline commit 已完成（commit `6e532e8`），任何阶段出问题可直接 `git checkout 6e532e8` 回退。云数据库快照待用户在微信开发者工具中导出。

每个 Phase 内部再拆为若干子任务，每子任务有明确的：
- **负责角色** → 谁干
- **输入** → 干之前需要什么
- **产出** → 干完交付什么
- **验证** → 怎么确认干对了
- **下一步** → 干完之后交给谁

---

## Git 安全网 — 已完成 ✓

- **Baseline commit `6e532e8`**: 锁住 vibe coding 全貌，随时可回退 — `git checkout 6e532e8`
- **Cleanup commit `6951627`**: 删除 9 补丁 MD + 6 补丁 SH + 2 冗余 docs，完善 .gitignore
- **回滚**: 任何阶段出问题 → `git checkout 6e532e8` 回退到开工前完整状态
- **云数据库快照**: 待用户在微信开发者工具中手动导出（Loop 2 ID 重构前需完成）

---

## Phase 0：开工准备（5 层，严格按序执行）

### 执行依赖链

```
L5(清理遗留) → L1(AI基础设施) → L2(设计文档) → L3(编码约定) → L4(测试基础) → Phase 1 开工
```

> **铁律：每层必须完成后才能进入下一层。跳层 = vibe coding。**

---

### L5：清理 vibe coding 遗留 — 已完成 ✓

| # | 任务 | 负责角色 | 产出 | 验证 |
|---|------|---------|------|------|
| L5-1 | 删除 12 个补丁 MD | 主理人(直接执行) | 根目录无 CACHE_FIX/WXML_ERROR_FIX 等 MD | `ls *.md` 只剩 README.md、PRD.md、CONVENTIONS.md |
| L5-2 | 删除 5 个修补脚本 | 主理人(直接执行) | 根目录无 .sh 修补脚本 | `ls *.sh` 无结果 |
| L5-3 | 迁移 insect_id_system_refactor.md → docs/architecture/ADR-001-id-refactor.md | 主理人(直接执行) | ADR-001 文件到位 | 原文件删除、新文件可读 |
| L5-4 | 评估旧 skills/ 目录，提取精华到 .workbuddy/skills/，删除原目录 | 主理人(直接执行) | .workbuddy/skills/ 有迁移内容，skills/ 已删除 | 无重复、无遗漏 |

**删除清单明细**：

| 文件 | 类型 | 处理方式 |
|------|------|---------|
| CACHE_CLEAR_INSTRUCTIONS.md | 补丁 MD | 删除 |
| CACHE_FIX_GUIDE.md | 补丁 MD | 删除 |
| DEPLOY_INSECT_DETAIL_FIX.md | 补丁 MD | 删除 |
| README_CDN.md | 补丁 MD | 删除 |
| README_IMAGES_FIX.md | 补丁 MD | 删除 |
| SIMPLE_STYLE_FIX_GUIDE.md | 补丁 MD | 删除 |
| STYLE_REFRESH_DEPLOYMENT_GUIDE.md | 补丁 MD | 删除 |
| TESTING_GUIDE.md | 补丁 MD | 删除 |
| WXML_COMPILATION_ERROR_FIX.md | 补丁 MD | 删除 |
| FIX_DATABASE_ISSUES.sh | 修补脚本 | 删除 |
| RUN_COMPLETE_REPAIR.sh | 修补脚本 | 删除 |
| deploy_calliNat.sh | 修补脚本 | 删除 |
| deploy_getInsectDetail.sh | 修补脚本 | 删除 |
| deploy_initialize_db.sh | 修补脚本 | 删除 |

---

### L1：AI First 基础设施

| # | 任务 | 负责角色 | 输入 | 产出 | 验证 |
|---|------|---------|------|------|------|
| L1-1 | 创建 loop-engineering skill | 架构师(高见远) | Loop Engineering 模型定义 | `.workbuddy/skills/loop-engineering/SKILL.md` | 内容覆盖 Plan→Build→Test→Review 循环 |
| L1-2 | 创建 wx-miniprogram skill | 架构师(高见远) | 微信小程序 API 参考 + 项目现有代码模式 | `.workbuddy/skills/wx-miniprogram/SKILL.md` | 覆盖生命周期、组件化、云开发限制 |
| L1-3 | 创建 service-split skill | 架构师(高见远) | index.js/camera.js 现状 + 拆分目标 | `.workbuddy/skills/service-split/SKILL.md` | 覆盖职责识别→接口定义→依赖注入流程 |
| L1-4 | 创建 design-system skill | 架构师(高见远) | 当前 WXSS 硬编码色值盘点 | `.workbuddy/skills/design-system/SKILL.md` | 定义颜色/间距/字体/动效 token 体系 |
| L1-5 | 创建 cloud-devops skill | 架构师(高见远) | 23 个云函数现状 + 合并目标 | `.workbuddy/skills/cloud-devops/SKILL.md` | 覆盖打包/部署/合并策略/环境变量 |
| L1-6 | 创建 insect-data-schema knowledge | PM(许清楚) | 现有数据库 + 硬编码数据盘点 | `.workbuddy/knowledge/insect-data-schema.md` | 字段、关系、ID 策略完整定义 |
| L1-7 | 创建 wx-architecture-decisions knowledge | 架构师(高见远) | 技术选型决策（云开发 vs 自建后端等） | `.workbuddy/knowledge/wx-architecture-decisions.md` | 每条 ADR 有背景/决策/后果 |
| L1-8 | 创建 service-extract prompt | 主理人(直接执行) | service-split skill + 拆分目标 | `.workbuddy/prompts/service-extract.md` | 从 Page 对象抽离 Service 的详细指令 |
| L1-9 | 创建 async-convert prompt | 主理人(直接执行) | camera.js callback hell 分析 | `.workbuddy/prompts/async-convert.md` | callback → async/await 转换指令 |
| L1-10 | 创建 cloud-fn-merge prompt | 主理人(直接执行) | 23→3 合并策略 | `.workbuddy/prompts/cloud-fn-merge.md` | 云函数合并指令 |

**Skill/Knowledge 清单汇总**：

| 类别 | 名称 | 注入给谁 |
|------|------|---------|
| Skill | loop-engineering | 全员 |
| Skill | wx-miniprogram | 工程师 + 架构师 + QA |
| Skill | service-split | 工程师 + 架构师 |
| Skill | design-system | 工程师 |
| Skill | cloud-devops | 工程师 + 架构师 |
| Knowledge | insect-data-schema | 全员 |
| Knowledge | wx-architecture-decisions | 架构师 + 工程师 |
| Prompt | service-extract | 工程师 |
| Prompt | async-convert | 工程师 |
| Prompt | cloud-fn-merge | 工程师 |

---

### L2：架构与设计文档

| # | 任务 | 负责角色 | 输入 | 产出 | 验证 |
|---|------|---------|------|------|------|
| L2-1 | 撰写增量 PRD | PM(许清楚) | 现有 PRD.md + 8 个症状诊断 + 用户确认的重构方向 | `docs/prd/PRD-incremental.md` | 仅描述变更部分，需求池 P0/P1/P2 清晰 |
| L2-2 | 撰写系统架构全景 | 架构师(高见远) | PRD-incremental + wx-miniprogram skill + insect-data-schema | `docs/architecture/ARCHITECTURE.md` | 模块划分、数据流、接口定义完整 |
| L2-3 | 撰写 ADR-002 Service 层引入 | 架构师(高见远) | ARCHITECTURE.md | `docs/architecture/ADR-002-service-layer.md` | 有背景/决策/后果 |
| L2-4 | 撰写 ADR-003 云函数合并 | 架构师(高见远) | ARCHITECTURE.md + cloud-devops skill | `docs/architecture/ADR-003-cloud-fn-merge.md` | 有背景/决策/后果 |
| L2-5 | 绘制类图 | 架构师(高见远) | ARCHITECTURE.md | `docs/architecture/class-diagram.mmd` | 8 个 Service + 3 个 API 类关系清晰 |
| L2-6 | 绘制拍照识别时序图 | 架构师(高见远) | camera.js 现状 + 拆分目标 | `docs/architecture/sequence-camera.mmd` | 用户→压缩→识别→保存→展示完整流程 |
| L2-7 | 撰写 Loop 1 计划 + 任务列表 | 架构师(高见远) | ARCHITECTURE.md + ADR-002/003 | `docs/loops/loop-1-extract/PLAN.md` + `TASKS.md` | 任务有序、含依赖、按实现顺序排列 |
| L2-8 | 撰写 Loop 2 计划 + 任务列表 | 架构师(高见远) | Loop 1 任务列表 + ADR-001/002/003 | `docs/loops/loop-2-normalize/PLAN.md` + `TASKS.md` | 同上 |
| L2-9 | 撰写 Loop 3 计划 + 任务列表 | 架构师(高见远) | Loop 2 任务列表 | `docs/loops/loop-3-close/PLAN.md` + `TASKS.md` | 同上 |

---

### L3：编码约定与配置

| # | 任务 | 负责角色 | 输入 | 产出 | 验证 |
|---|------|---------|------|------|------|
| L3-1 | 创建 CONVENTIONS.md | 主理人(直接执行) | ARCHITECTURE.md + design-system skill | `CONVENTIONS.md` | 8 条核心约定见下方 |
| L3-2 | 创建 .editorconfig | 主理人(直接执行) | 无 | `.editorconfig` | 2空格缩进、UTF-8、LF换行 |
| L3-3 | 创建 jest.config.js | QA(严过关) | 测试基础规范 | `tests/jest.config.js` | mock wx API、覆盖率目标 ≥60% |

**CONVENTIONS.md 8 条核心约定**：

```
1. 文件命名: camelCase Service（insectService.js）
2. 函数命名: 动词+名词（getInsectById, markInsectFound）
3. 最大行数: 200行/文件（超出即拆分）
4. 错误处理: 统一 handleError()，不允许各 Page 自行 try/catch
5. 缓存策略: 通过 cacheService 统一读写，禁止直接 wx.setStorageSync
6. 状态管理: 通过 store.js 统一，禁止散布的 globalData 操作
7. 异步模式: async/await + timeoutWrap()，禁止超过 2 层回调嵌套
8. 云函数调用: 通过统一入口（insectApi/userApi/adminApi），禁止直接 wx.cloud.callFunction
9. 样式取值: 从 design-system token 取值，禁止硬编码色值/间距
```

---

### L4：测试基础设施

| # | 任务 | 负责角色 | 输入 | 产出 | 验证 |
|---|------|---------|------|------|------|
| L4-1 | 创建 tests/ 目录结构 | QA(严过关) | jest.config.js | `tests/unit/` + `tests/integration/` | 目录存在 |
| L4-2 | 创建 wx mock 工具 | QA(严过关) | wx-miniprogram skill | `tests/helpers/wxMock.js` | mock 覆盖 wx.cloud、wx.setStorageSync、wx.request 等 |
| L4-3 | 创建 Service 测试骨架 | QA(严过关) | ARCHITECTURE.md + TASKS.md | 8 个 .test.js 骨架文件 | 每个核心 Service 有对应测试文件（空壳，待 Loop 填充） |

---

### Phase 0 验收标准

| 指标 | 目标值 |
|------|--------|
| 根目录补丁 MD 数 | 0 |
| 根目录修补脚本数 | 0 |
| .workbuddy/skills/ 文件数 | ≥ 4（loop-engineering, wx-miniprogram, service-split, design-system, cloud-devops） |
| .workbuddy/knowledge/ 文件数 | ≥ 2 |
| .workbuddy/prompts/ 文件数 | ≥ 3 |
| docs/architecture/ 文件数 | ≥ 6 |
| docs/loops/ 子目录数 | 3（各含 PLAN.md + TASKS.md） |
| tests/unit/ .test.js 文件数 | ≥ 8（骨架） |
| CONVENTIONS.md 存在 | ✅ |
| jest.config.js 可运行 | ✅ |

---

## Phase 1：Loop 1 — 抽离（从 God Object 拆出 Service）

### 执行路径

```
Loop 1-1: 拆 insectService (从 index.js) → 测试 → 验证
Loop 1-2: 拆 cacheService (从 index.js) → 测试 → 验证
Loop 1-3: 拆 levelService + knowledgeService + adminService (从 index.js) → 测试 → 验证
Loop 1-4: 拆 recognitionService + imageService + saveService (从 camera.js) → 测试 → 验证
Loop 1-5: 合并云函数 23→3 → 测试 → 验证
Loop 1-6: 瘦身 index.js + camera.js → ≤200行 → 全量回归测试
```

> 每个子 Loop 遵循 **Plan → Build → Test → Review → Merge** 完整闭环。

---

### Loop 1-1：拆 insectService

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师(高见远) | index.js 源码 + TASKS.md + service-split skill | insectService 接口设计 | 接口清单、方法签名、依赖关系完整 |
| Build | 工程师(寇豆码) | 接口设计 + service-extract prompt + wx-miniprogram skill | `miniprogram/services/insectService.js` | ≤ 200行、无 wx.setStorageSync、无硬编码数据 |
| Test | QA(严过关) | insectService.js + wxMock | `tests/unit/insectService.test.js` | 核心方法测试通过、mock wx.cloud 调用正确 |
| Review | 架构师(高见远) | insectService.js + test 结果 | IS_PASS: YES/NO | 接口是否符合设计、命名是否符合 CONVENTIONS |
| Merge | 主理人 | Review 通过 | 代码合并到主分支 | 回归测试全通过 |

**insectService 目标接口**：

```
getInsectList(options)        — 获取昆虫列表（从 DB → 缓存策略）
getInsectById(id)             — 按 ID 获取单只昆虫详情
getInsectImages(id)           — 获取昆虫图片集
searchInsect(keyword)         — 搜索昆虫（名称/分类）
fetchBaiduEncyclopedia(name)  — 获取百度百科信息
```

---

### Loop 1-2：拆 cacheService

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | index.js 缓存逻辑盘点 | cacheService 接口设计 | 统一读/写/清除/过期策略 |
| Build | 工程师 | 接口设计 | `miniprogram/services/cacheService.js` | ≤ 150行、替代所有散布的 wx.setStorageSync |
| Test | QA | cacheService.js + wxMock | `tests/unit/cacheService.test.js` | 读写/过期/清除测试通过 |
| Review | 架构师 | 代码 + 测试 | IS_PASS | 是否彻底替代了散布式缓存 |
| Merge | 主理人 | Review 通过 | 合并 | 回归通过 |

**cacheService 目标接口**：

```
get(key, options)              — 读缓存（支持过期检查、fallback）
set(key, value, ttl)           — 写缓存（支持 TTL）
remove(key)                    — 删除单条
clear(pattern)                 — 按模式批量清除
getInsectCache(id)             — 昆虫数据专用缓存读
setInsectCache(id, data, ttl)  — 昆虫数据专用缓存写
```

---

### Loop 1-3：拆 levelService + knowledgeService + adminService

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | index.js 等级/冷知识/管理逻辑 | 3 个 Service 接口设计 | 各接口独立、互不依赖 |
| Build | 工程师 | 3 个接口设计 | `levelService.js` + `knowledgeService.js` + `adminService.js` | 每个 ≤ 150行 |
| Test | QA | 3 个 Service + wxMock | 3 个 .test.js | 等级计算/冷知识轮播/权限检查测试通过 |
| Review | 架构师 | 代码 + 测试 | IS_PASS | 同上 |
| Merge | 主理人 | Review 通过 | 合并 | 回归通过 |

**levelService 目标接口**：

```
calculateLevel(foundCount)        — 计算当前等级
getLevelConfig(level)             — 获取等级配置（从 DB，替代硬编码）
getBadges(openid)                 — 获取用户徽章列表
calculateProgress(found, total)   — 计算发现进度百分比
```

**knowledgeService 目标接口**：

```
getFunFacts(insectId)       — 获取冷知识列表
getNextFunFact(insectId)    — 获取下一条冷知识（轮播）
```

**adminService 目标接口**：

```
checkPermission(openid)     — 检查管理员权限
```

---

### Loop 1-4：拆 recognitionService + imageService + saveService

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | camera.js 源码 + callback hell 分析 | 3 个 Service 接口设计 + async 流程设计 |
| Build | 工程师 | 3 个接口设计 + async-convert prompt | 3 个 Service 文件 | 每个 ≤ 150行、async/await、无 3 层嵌套 |
| Test | QA | 3 个 Service + wxMock | 3 个 .test.js | 识别流程/压缩/保存测试通过 |
| Review | 架构师 | 代码 + 测试 | IS_PASS | callback 是否已彻底替换 |
| Merge | 主理人 | Review 通过 | 合并 | 回归通过 |

**recognitionService 目标接口**：

```
recognizeInsect(imageBase64)       — 识别昆虫（调用豆包视觉API）
getInsectDetail(name)              — 获取识别结果的详细信息
confirmSelection(insectData)       — 确认识别结果
```

**imageService 目标接口**：

```
compressImage(tempFilePath, quality)  — 图片压缩
uploadImage(tempFilePath)             — 上传到云存储
imageToBase64(tempFilePath)           — 图片转 base64
```

**saveService 目标接口**：

```
markFound(insectId)         — 标记昆虫已发现
saveInsectImage(insectId, fileID)  — 保存昆虫图片
clearInsectCache(insectId)  — 清除对应缓存
```

---

### Loop 1-5：合并云函数 23 → 3

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | 23 个云函数清单 + cloud-fn-merge prompt | 3 类统一入口设计 + 合并映射表 |
| Build | 工程师 | 合并设计 | `cloudfunctions/insectApi/` + `userApi/` + `adminApi/` | 每个入口文件 ≤ 200行、统一错误处理 |
| Test | QA | 3 个云函数 | `tests/integration/insectApi.test.js` + `userApi.test.js` + `adminApi.test.js` | 集成测试通过 |
| Review | 架构师 | 代码 + 测试 | IS_PASS | 所有原云函数功能是否被新入口覆盖 |
| Merge | 主理人 | Review 通过 | 合并 | 回归通过 |

**云函数合并映射**：

| 新入口 | 合入的原函数 |
|--------|------------|
| insectApi | getInsectList, getInsectDetail, getInsectImages, fetchBaiduEncyclopedia, calliNatIdentification |
| userApi | markFound, getOpenId, getUserOpenid, getUserList, checkAdminPermission |
| adminApi | saveBadge, deleteBadge, getBadgeList, saveFunFact, deleteFunFact, getFunFactsList, initializeDb |

---

### Loop 1-6：瘦身 Page 文件 + 全量回归

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Build | 工程师 | 全部 Service + store + utils | `index.js` ≤ 200行 + `camera.js` ≤ 200行 | Page 只做 UI 绑定 + 事件分发 |
| Test | QA | 瘦身后 Page + 全部 Service | 全量回归测试 | 核心路径 100% 通过 |
| Review | 架构师 | 全部代码 | IS_PASS: YES | index.js/camera.js 行数 ≤ 200 |

**Loop 1-6 后 index.js 预期结构**：

```javascript
// index.js — 目标 ≤ 200行
import { insectService } from '../services/insectService'
import { levelService } from '../services/levelService'
import { cacheService } from '../services/cacheService'

Page({
  data: { insects: [], level: 1, progress: 0, badges: [] },
  
  onLoad() { this.loadHomeData() },
  
  async loadHomeData() {
    const insects = await insectService.getInsectList()
    const level = await levelService.calculateLevel(insects.length)
    this.setData({ insects, level, progress: levelService.calculateProgress(insects.length, insects.total) })
  },
  
  onInsectTap(e) { wx.navigateTo({ url: `/subpages/insect-detail/insect-detail?id=${e.currentTarget.dataset.id}` }) },
  onCameraTap() { wx.navigateTo({ url: '/pages/camera/camera' }) },
  // ... 仅 UI 事件分发
})
```

---

### Phase 1 验收标准

| 指标 | 目标值 |
|------|--------|
| index.js 行数 | ≤ 200 |
| camera.js 行数 | ≤ 200 |
| Service 文件数 | 8（每个 ≤ 200行） |
| 云函数数 | 3（insectApi/userApi/adminApi） |
| 单元测试通过率 | 100%（核心 Service） |
| 回归测试通过率 | 100%（核心路径） |

---

## Phase 2：Loop 2 — 规范化

### 执行路径

```
Loop 2-1: 执行 ID 重构（externalId） → 数据迁移 → 测试
Loop 2-2: async/await 全量替换 → 测试
Loop 2-3: 统一状态管理（store.js） → 测试
Loop 2-4: 统一错误处理 + 清除补丁依赖 → 测试
Loop 2-5: design-system token 替换硬编码样式 → 测试
```

---

### Loop 2-1：ID 重构

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | ADR-001-id-refactor.md + insect-data-schema | 数据迁移方案 + externalId 字段设计 |
| Build | 工程师 | 迁移方案 | 数据库迁移脚本 + insectService 适配 | 全部昆虫有 externalId |
| Test | QA | 迁移后数据 + insectService | 迁移验证测试 | ID 查询/关联/无重复 |
| Review | 架构师 | 代码 + 测试 | IS_PASS | 硬编码 INSECT_NAME_MAP 是否已彻底移除 |
| Merge | 主理人 | Review 通过 | 合并 | 回归通过 |

---

### Loop 2-2：async/await 全量替换

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | camera.js callback hell 分析 | async 流程设计 + timeoutWrap 工具定义 |
| Build | 工程师 | async-convert prompt | `miniprogram/utils/timeoutWrap.js` + `asyncUtil.js` + 全部 Service async 化 |
| Test | QA | async 化代码 | 超时/异常/取消测试 | 无超过 2 层嵌套 |
| Review | 架构师 | 代码 + 测试 | IS_PASS | 无 callback 嵌套残留 |

---

### Loop 2-3：统一状态管理

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | 现有 globalData 使用盘点 | store.js 接口设计 |
| Build | 工程师 | store 设计 | `miniprogram/store/store.js` + `behavior.js` | 替代散布的 globalData |
| Test | QA | store.js | 状态读写/响应式测试 | 状态变更触发 UI 更新 |

---

### Loop 2-4：统一错误处理

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | 各 Page try/catch 策略盘点 | handleError 设计 |
| Build | 工程师 | handleError 设计 | `miniprogram/utils/errorHandler.js` + `logUtil.js` | 统一错误码 + 日志记录 |
| Test | QA | errorHandler | 异常捕获/日志/用户提示测试 | 无 Page 自行 try/catch |

---

### Loop 2-5：design-system token 替换硬编码样式

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | 架构师 | design-system skill + 当前 WXSS 色值盘点 | token 定义文件 |
| Build | 工程师 | token 定义 | `miniprogram/styles/tokens.wxss` + 各页面 WXSS 替换 | 无硬编码色值/间距 |
| Test | QA | 替换后样式 | 视觉对比测试 | 颜色/间距一致性 |

**design-system token 预期结构**：

```wxss
/* miniprogram/styles/tokens.wxss */
/* 颜色 */
@token-color-primary: #2a9d8f;
@token-color-secondary: #667eea;
@token-color-accent: #764ba2;
@token-color-bg: #f0f9f2;
@token-color-text: #333;
@token-color-text-light: #666;

/* 间距 */
@token-spacing-xs: 10rpx;
@token-spacing-sm: 20rpx;
@token-spacing-md: 30rpx;
@token-spacing-lg: 40rpx;
@token-spacing-xl: 60rpx;

/* 字体 */
@token-font-xs: 24rpx;
@token-font-sm: 26rpx;
@token-font-md: 32rpx;
@token-font-lg: 40rpx;
@token-font-xl: 48rpx;

/* 圆角 */
@token-radius-sm: 10rpx;
@token-radius-md: 20rpx;
@token-radius-lg: 30rpx;

/* 阴影 */
@token-shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
@token-shadow-md: 0 4rpx 15rpx rgba(0, 0, 0, 0.05);
```

---

### Phase 2 验收标准

| 指标 | 目标值 |
|------|--------|
| 硬编码 INSECT_NAME_MAP/INSECT_SUGGESTIONS | 0（全部从 DB 读取） |
| callback 嵌套层数 | ≤ 2 |
| wx.setStorageSync 直接调用数 | 0（全部走 cacheService） |
| globalData 散布操作数 | 0（全部走 store.js） |
| Page 自行 try/catch 数 | 0（全部走 errorHandler） |
| 硬编码色值/间距数 | 0（全部从 token 取值） |
| 回归测试通过率 | 100% |

---

## Phase 3：Loop 3 — 闭环

### 执行路径

```
Loop 3-1: 补充单元测试覆盖率 → 目标 ≥ 60%
Loop 3-2: 云函数集成测试
Loop 3-3: E2E 验收流程测试
Loop 3-4: 最终回归 + 交付验收
```

---

### Loop 3-1：补充单元测试覆盖率

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Plan | QA | Loop 1+2 测试结果 + 覆盖率报告 | 需补充测试清单 |
| Build | QA | 补充清单 | 补充 .test.js 文件 | 覆盖率 ≥ 60% |
| Review | QA | 覆盖率报告 | 全通过 | 覆盖率达标 |

---

### Loop 3-2：云函数集成测试

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Build | QA | 3 个云函数 | `tests/integration/insectApi.test.js` + `userApi.test.js` + `adminApi.test.js` | 集成测试全通过 |

---

### Loop 3-3：E2E 验收

| 步骤 | 负责角色 | 输入 | 产出 | 验证 |
|------|---------|------|------|------|
| Execute | QA + 主理人 | 全部代码 | E2E 验收报告 | 拍照识别→保存→首页展示→删除 完整流程 |

**E2E 验收流程清单**：

1. 打开小程序 → 首页加载昆虫列表
2. 点击拍照按钮 → 进入 camera 页面
3. 拍照/选择图片 → 图片压缩 → 识别 → 结果展示
4. 确认选择 → 保存 → 标记已发现 → 返回首页
5. 首页刷新 → 进度更新 → 徽章展示
6. 点击昆虫 → 详情页 → 冷知识轮播
7. 管理员页面 → 添加/删除徽章/冷知识

---

### Loop 3-4：最终回归 + 交付

| 步骤 | 负责角色 | 产出 | 验证 |
|------|---------|------|------|
| Final Regression | QA | 全量回归报告 | 所有测试通过 |
| Delivery Review | 主理人 | 交付总结 | 对比 Phase 0-3 全部验收标准 |
| CHANGELOG | 主理人 | `docs/prd/CHANGELOG.md` | 每个 Loop 变更记录完整 |

---

### Phase 3 验收标准

| 指标 | 目标值 |
|------|--------|
| 单元测试覆盖率 | ≥ 60%（核心路径） |
| 集成测试通过率 | 100% |
| E2E 验收流程 | 全 7 步通过 |
| 回归测试通过率 | 100% |
| 交付文档完整度 | PRD + 架构 + 任务 + 测试 + CHANGELOG |

---

## 全工程计划汇总

### Phase × 任务矩阵

| Phase | 子任务数 | 涉及角色 | 预估关键产出 |
|-------|---------|---------|------------|
| Phase -1 | 5 | 主理人 | Git基线 + DB快照 + .gitignore + remote + 回滚SOP |
| Phase 0 L5 | 4 | 主理人 | 根目录干净 |
| Phase 0 L1 | 10 | 架构师+PM+主理人 | 5 skills + 2 knowledge + 3 prompts |
| Phase 0 L2 | 9 | PM+架构师 | 增量PRD + ARCHITECTURE.md + 3 ADR + 2 图 + 6 Loop计划/任务 |
| Phase 0 L3 | 3 | 主理人+QA | CONVENTIONS.md + .editorconfig + jest.config.js |
| Phase 0 L4 | 3 | QA | tests/骨架 + wxMock + 8个.test.js骨架 |
| Phase 1 | 6×5步 | 架构师+工程师+QA | 8 Service + 3 云函数 + Page瘦身 |
| Phase 2 | 5×5步 | 架构师+工程师+QA | ID重构 + async + store + errorHandler + tokens |
| Phase 3 | 4 | QA+主理人 | 测试覆盖 + 集成测试 + E2E + 交付报告 |

### 关键里程碑

| 里程碑 | 含义 | 验收标志 |
|--------|------|---------|
| M-1: 安全网就绪 | Phase -1 完成 | Git基线+remote+DB快照+回滚SOP |
| M0: 准备就绪 | Phase 0 全部完成 | 5层验收标准全达标 |
| M1: 模块化完成 | Phase 1 完成 | index.js/camera.js ≤ 200行、8 Service 就位 |
| M2: 规范化完成 | Phase 2 完成 | 零硬编码、零callback嵌套、零散布缓存 |
| M3: 闭环完成 | Phase 3 完成 | 测试覆盖率 ≥ 60%、E2E 全通过 |

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 数据迁移失败（ID 重构） | 中 | 高 | 迁移前备份数据库（Phase -1 DB 快照）、分批迁移、回滚脚本 + ROLLBACK-SOP 场景B |
| 云函数合并后功能缺失 | 中 | 高 | 逐一验证原 23 个函数的所有调用路径 + 旧函数归档到 _archive/ 不直接删除 |
| 回归测试发现新 Bug | 高 | 中 | 每个 Loop 自闭环，不累积 Bug + git revert 分支即可回退 |
| 微信小程序 API 变更 | 低 | 低 | wx-miniprogram skill 定期更新 |
| 工程师忽视视觉细节 | 中 | 低 | design-system token 约束 + 架构师 Review 检查 |
| 电脑丢失 / 磁盘损坏 | 低 | 极高 | Phase -1 建立 Git remote（GitHub/Gitee），云端有完整备份 |

---

## 附录：团队分工一览

| 角色 | Agent ID | Phase -1 负责 | Phase 0 负责 | Phase 1 负责 | Phase 2 负责 | Phase 3 负责 |
|------|----------|---------------|-------------|-------------|-------------|-------------|
| 主理人(齐活林) | - | P-1-1~5 全部 | L5全部 + L3-1/2 + L1-8/9/10 | Merge 验收 | Merge 验收 | 交付验收 |
| PM(许清楚) | software-product-manager | 无 | L1-6(knowledge) + L2-1(PRD) | 无 | 无 | 无 |
| 架构师(高见远) | software-architect | 无 | L1-1~5(skill) + L1-7 + L2-2~9 | Plan + Review | Plan + Review | 无 |
| 工程师(寇豆码) | software-engineer | 无 | L3-3(jest)可选 | Build 全部 | Build 全部 | 无 |
| QA(严过关) | software-qa-engineer | 无 | L3-3 + L4-1~3 | Test 全部 | Test 全部 | Test + E2E |

---

> **下一步**：用户确认本计划 → 主理人创建团队 → Phase -1 安全网搭建 → Phase 0 L5 开工
