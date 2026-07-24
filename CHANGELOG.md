# 昆虫图鉴 - CHANGELOG

> 格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)

## [Unreleased]

### 规划中

- [ ] Phase 1: Service 拆分（cache/level/knowledge/recognition/imageUpload/save/errorHandler/timeoutWrap）
- [ ] Phase 2: 云函数合并为 3 个统一入口
- [ ] Phase 3: ID 系统重构（name → externalId）
- [ ] Phase 4: 全面 TDD 回归
- [ ] Phase 5: async/await 全量替换 + 设计 Token 化样式 + Discovery 接入真实数据

---

## [0.2.2] — 2025-11 (当前线上版本)

### 变更
- 样式修复，简洁风格版本（app.js 版本号标记）
- 冷知识从数据库加载 + 本地数据备用
- 等级系统从徽章配置动态读取
- 图片搜索降级：本地映射 → 百度图片 → 默认图

### 已知问题
- camera.js 1189 行，未遵守 200 行约定
- 部分调试日志未清理
- fetchBaiduEncyclopedia 将 debugInfo 返回客户端
- ID 系统不统一（name / externalId / _id 混用）

---

## [0.2.0] — Loop 1-1 重构完成

### 新增
- `services/insectService.js`：抽离昆虫数据服务
- `tests/unit/insectService.test.js`：45 个单元测试
- `jest.config.js` + `tests/setup.js`：Jest 测试基础设施

### 变更
- `pages/index/index.js`：948 → 794 行
- 引入 `imageHelper.js` 统一图片 URL 获取
- 首页支持缓存恢复和分页加载

---

## [0.1.0] — Vibe Coding 初始版本

### 新增
- 基础拍照识别流程（calliNat 云函数）
- 首页图鉴列表 + 进度展示
- 用户发现记录保存（markFound 云函数）
- 管理员后台基础页面
- 23 个云函数目录

### 已知问题
- 大量重复代码、调试日志、回调嵌套
- 缺少 Systematic testing
- 文档不完整

---

*最后更新：2026-07-24*
