# 版本管理手册

> 最后更新：2026-07-24  
> Git 基线：`6e532e8`（vibe coding 全貌快照，可随时回退）  
> 最新文档基线：`d4623c8`

---

## 回滚机制

### 方案 A：Git 硬回退（最安全）

```bash
# 回到 vibe coding 原始状态
git checkout 6e532e8

# 丢弃所有未提交更改
git reset --hard HEAD
```

**适用场景**：重构出现严重 bug、AI 写错代码、数据库迁移失败。

### 方案 B：分支隔离（日常开发）

```bash
# 每次重构开独立分支
git checkout -b loop/1-2-cacheService master

# 完成并提交
git add services/cacheService.js tests/unit/cacheService.test.js
git commit -m "[phase-1] extract cacheService with 10 unit tests"

# 合并到 master（确认测试全部通过）
git checkout master
git merge --no-ff loop/1-2-cacheService
```

**适用场景**：正常重构流程，每步都有明确验收标准。

### 方案 C：DB 快照恢复

```bash
# 在微信开发者工具中导出云数据库为 JSON
# 导出前执行：
# cloud1-8ggzed032ed5ec → 数据库 → insects / user_insects / badges / fun_facts / user_stats

# 备份文件名约定：
# backup_<collection>_<date>.json
# 例如：backup_user_insects_20260724.json
```

**适用场景**：ID 重构、集合结构变更前必须执行。

---

## Commit 规范

```
[phase-N] <动词短语> — <补充说明>

# 示例：
[phase-0] clean debug logs and unify insect name map
[phase-1] extract cacheService with 10 unit tests
[phase-1] refactor camera.js to <200 lines via 3 service calls
[phase-2] merge getInsectList into insectApi/insectList handler
[phase-3] migrate user_insects.insectId to insectExternalId
```

**为什么用 `[phase-N]` 前缀**：

1. 一眼看出属于哪个重构阶段
2. `git log --oneline | grep phase-1` 可快速定位某个阶段的变更
3. 方便 review 时按阶段追踪进度

---

## 分支命名约定

| 分支类型 | 格式 | 示例 |
|---------|------|------|
| 重构循环 | `loop/<N>-<module>` | `loop/1-2-cacheService` |
| 热修复 | `hotfix/<issue-id>-<short-desc>` | `hotfix/CR-001-markFound-null-check` |
| 特性 | `feature/<description>` | `feature/discovery-real-data` |
| 临时实验 | `exp/<description>` | `exp/new-recognition-model` |

---

## 远程同步

项目配置了两个 remote：

| Remote | URL | 用途 |
|--------|-----|------|
| `gitee` | `git@gitee.com:free-style_2_0/insect-book.git` | 国内加速备份 |
| `github` | `git@github.com:pomelo56/insectBook.git` | 国际备份 / GitHub 查看 |

### 推送规范

```bash
# 每个 Loop 完成后推送到对应 remote
git push gitee loop/1-2-cacheService
git push github loop/1-2-cacheService

# 合并到 master 后推送
git push gitee master
git push github master
```

**建议**：至少推送到一个 remote，避免两个都 push（减少冲突风险）。

---

## 关键节点清单

| 操作前必须执行 | 命令/动作 |
|---------------|----------|
| 任何重构开始前 | `git status` 确认干净工作区 |
| DB 迁移前 | 导出 insects + user_insects 快照 |
| 云函数合并前 | 在微信开发者工具中逐个部署确认旧函数仍可用 |
| 大改动合并前 | 跑全量测试 `npx jest` |
| 上线前 | `git pull origin master` 确认无冲突 |

---

## Tag 策略

建议使用语义化版本号打 tag：

```bash
# 当前已发布版本是 0.2.2，不要回退
git tag -a v0.2.2 -m "样式修复，简洁风格"

# 下次发布时：
git tag -a v0.3.0 -m "Service 拆分完成，camera/index/detail <200行"
```

---

## 快速恢复流程

```bash
# 场景：重构后发现严重问题

# 1. 确认当前状态
git status

# 2. 如果还没有 commit，直接放弃
git reset --hard HEAD

# 3. 如果已经 commit，回到上一个稳定点
git log --oneline | grep "baseline\|v0.2.2"

# 4. 回到 vibe coding 全貌
git checkout 6e532e8

# 5. 恢复 DB 快照
# 微信开发者工具 → 云开发 → 数据库 → 导入 JSON
```
