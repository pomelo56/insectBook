# insectBook 回滚 SOP

> 版本：v1.0 | 日期：2026-06-27
> 原则：**没有安全网就开工 = vibe coding。每个 Loop 自带回滚能力。**

---

## 一、回滚能力层级

| 层级 | 覆盖范围 | 回滚手段 | 触发条件 |
|------|---------|---------|---------|
| **L0: 全工程回退** | 回到开工前 vibe coding 状态 | `git checkout baseline-vibe-coding-snapshot` + 恢复 DB 快照 | Phase 1 整体失败，需要放弃重构 |
| **L1: 单 Loop 回退** | 回到某个 Loop 开始前的状态 | `git revert loop/N-xxx 分支` + 恢复该 Loop 前的 DB 快照 | 单个 Loop 测试未通过（IS_PASS: NO），2 轮修复后仍不过 |
| **L2: 单文件回退** | 回到某个文件修改前的状态 | `git checkout <commit> -- <file>` | 单文件引入 Bug，其他文件正常 |

---

## 二、每个 Loop 的安全网流程

```
Loop 开始前:
  1. git checkout main → git pull
  2. git checkout -b loop/N-xxx           ← 创建分支
  3. 导出云数据库快照 → docs/snapshots/db-xxx-YYYY-MM-DD.json
  4. git add docs/snapshots/ → git commit -m "snapshot: loop/N pre-start DB backup"

Loop 进行中:
  5. 在 loop/N 分支上实现 + 测试
  6. 每个 Service 完成后 commit: "loop/N: insectService done"
  7. 全部完成后 QA 验证 → IS_PASS?

Loop 结束后:
  Pass → git checkout main → git merge loop/N-xxx → git push
  Fail → git checkout main → git branch -D loop/N-xxx → 恢复 DB 快照
```

---

## 三、具体回滚场景和操作命令

### 场景 A：单个 Loop 失败，回退到该 Loop 之前的状态

**触发条件**：QA 2 轮测试后 IS_PASS: NO

**操作**：

```bash
# 1. 回到 main 分支
git checkout main

# 2. 删除失败的 Loop 分支
git branch -D loop/N-xxx

# 3. 恢复数据库快照（该 Loop 开始前导出的）
# 在微信开发者工具中，或通过云函数导入 docs/snapshots/db-insects-YYYY-MM-DD.json
# 也可以手动逐条恢复

# 4. 验证回滚成功
git log --oneline -5  # 确认 main 上最新的 commit 是上一个 Loop 的 merge
# 在微信开发者工具中预览，确认功能正常
```

**后果**：该 Loop 白干了，但之前的所有 Loop 仍然在 main 上，不会丢。

---

### 场景 B：Loop 2-1（ID 重构）数据迁移失败

**触发条件**：数据迁移后查询/关联异常，无法在 2 轮内修复

**操作**：

```bash
# 1. 回退代码
git checkout main
git branch -D loop/2-1-id-refactor

# 2. 恢复数据库到迁移前的快照
# 导入 docs/snapshots/db-insects-2026-06-27.json（或 loop/2 开始前的快照）

# 3. 验证
# 确认昆虫列表查询正常、用户发现记录正常
```

**后果**：昆虫数据回到硬编码 INSECT_NAME_MAP 时代，但功能完全正常——只是没有 externalId。可以等后续重新尝试迁移。

---

### 场景 C：全工程回退 — 放弃重构，回到 vibe coding 状态

**触发条件**：Phase 1 整体失败（多次 Loop 失败累积），或用户决定不重构

**操作**：

```bash
# 1. 回到 baseline commit
git checkout baseline-vibe-coding-snapshot

# 2. 恢复数据库到 baseline 快照
# 导入 docs/snapshots/db-insects-2026-06-27.json + db-user-insects-2026-06-27.json

# 3. 创建新分支继续 vibe coding（如果需要）
git checkout -b vibe-coding-continue

# 4. 验证
# 在微信开发者工具中预览，确认所有功能正常
```

**后果**：回到重构前的完整运行状态，没有任何丢失。只是重构工作白干了。

---

### 场景 D：单文件回退 — 某个 Service 引入 Bug

**触发条件**：某个 Service 文件有 Bug，但其他 Service 正常

**操作**：

```bash
# 1. 找到该文件上一个正常版本的 commit
git log --oneline -- miniprogram/services/insectService.js

# 2. 回退该文件到上一个版本
git checkout <正常版本的commit-hash> -- miniprogram/services/insectService.js

# 3. commit 回退
git commit -m "rollback: insectService to previous working version"

# 4. 通知工程师修复后重新提交
```

**后果**：只有该文件回到旧版本，其他文件不受影响。最小范围的回滚。

---

### 场景 E：云函数部署失败

**触发条件**：合并后的云函数部署到云端后报错

**操作**：

```bash
# 代码层面回退同场景 A 或 D

# 云函数层面：
# 1. 在微信开发者工具中，重新上传旧的云函数版本
# 2. 或使用云开发控制台回退到上一个部署版本

# 注意：微信云开发没有版本回退功能，需要重新上传旧代码
# 因此旧的云函数代码目录在合并前不应删除，而是移到 cloudfunctions/_archive/
```

**预防措施**：合并云函数时，不删除旧目录，而是移到 `cloudfunctions/_archive/`，直到新版本验证通过后才删除。

---

## 四、快照命名约定

| 文件 | 命名格式 | 内容 |
|------|---------|------|
| 数据库快照 | `docs/snapshots/db-{collection}-{YYYY-MM-DD}.json` | 云数据库集合导出 |
| Git commit tag | `snapshot: loop/N pre-start DB backup` | Loop 开始前的 DB 快照 commit |
| Baseline tag | `baseline-vibe-coding-snapshot` | 开工前完整状态 |
| Loop 分支 | `loop/{N}-{name}` | 如 loop/1-extract, loop/2-normalize |

---

## 五、回滚验证 checklist

每次回滚后必须验证：

| 检查项 | 验证方式 |
|--------|---------|
| 代码状态 | `git log` 确认 commit 历史 |
| 数据库数据 | 在微信开发者工具中查询 insects/user_insects 记录数 |
| 小程序运行 | 在开发者工具中预览，首页加载、拍照识别、详情展示正常 |
| 云函数可用 | 调用关键云函数（getInsectList, markFound, calliNat）返回正确 |

---

## 六、关键原则

1. **每个 Loop 开始前必须拍快照** — 没有快照 = 没有回滚点 = 不能开工
2. **Loop 在独立分支开发** — main 分支永远保持可运行状态
3. **最坏情况 = 白干一个 Loop** — 之前的 Loop 都已合并到 main，不会丢
4. **永远不回退到 vibe coding 状态** — baseline 只是最坏情况的安全网，不是日常回滚目标
5. **旧云函数不删只归档** — 合并前移到 `_archive/`，新版本验证通过后再删
6. **数据库快照是最后防线** — Git 只管代码，数据库需要手动导出/导入

---

> **记住**：回滚不是失败，是工程纪律。能回滚说明你有安全网；不能回滚说明你在 vibe coding。
