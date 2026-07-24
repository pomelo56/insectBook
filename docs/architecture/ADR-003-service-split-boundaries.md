# ADR-003: Service 拆分边界与职责

> 状态：待执行  
> 创建日期：2026-07-24  
> 决策者：架构师 + 主理人

---

## 背景

当前业务逻辑散布在 Page 文件中：
- `camera.js`（1189 行）同时处理拍照、压缩、识别、手动输入、缓存清理、上传、保存
- `index.js`（794 行）同时处理数据加载、等级计算、冷知识轮播、图片修复
- `insect-detail.js`（973 行）同时处理详情加载、缓存管理、分页、发现记录查询

这导致：
- 无法独立测试单个业务逻辑
- AI Agent 难以理解局部意图
- 修改一个功能容易影响其他功能

---

## 决策

**采用纯 Service 层架构**，每个 Service 只负责单一业务领域，不操作 UI，不依赖 `this`。

### Service 清单与边界

| Service | 唯一职责 | 不做什么 | 来源函数 |
|---------|---------|---------|---------|
| `cacheService.js` | wx Storage 统一 CRUD + 过期策略 | 不关心存什么业务数据 | index/badges/detail 中的 setStorage/getStorage |
| `levelService.js` | 根据 collectedCount 计算等级和徽章 | 不调用数据库、不做 UI | index/updateUserLevel() + badges/loadBadgesFromDatabase() |
| `knowledgeService.js` | 冷知识加载、随机、轮播配置 | 不操作 UI 定时器 | index/initColdKnowledge() + startKnowledgeTimer() |
| `recognitionService.js` | 图片压缩→base64→AI 识别→结果解析 | 不保存发现、不上传照片 | camera/compressImage() + recognizeInsect() 前半 |
| `imageUploadService.js` | 图片压缩到云存储 + fileID 管理 | 不参与识别或保存流程 | camera/confirmSelection() 中的 uploadFile 部分 |
| `saveService.js` | markFound 完整流程封装（上传→写入→错误处理） | 不处理 UI 状态 | camera/confirmSelection() 后半 |
| `errorHandler.js` | 统一错误包装、格式化、降级策略 | 不包含业务逻辑 | 全项目散布的 try/catch |
| `timeoutWrap.js` | async 函数自动超时 reject | 不涉及具体业务超时语义 | 全项目手动 setTimeout |

### 设计原则

1. **纯函数优先**：Service 函数应可独立测试，不依赖 wx API
2. **依赖注入**：如果必须调用 wx API，通过参数传入 mockable 依赖
3. **单一出口**：每个 Service 导出 ≤ 5 个函数
4. **不操作 this**：Service 不能引用 Page 实例
5. **错误通过返回值表达**：不抛异常，返回 `{ success, data, error }`

### Page 的职责边界

重构后 Page 只做三件事：
1. 定义 `data` 初始状态
2. 监听用户事件，调用对应 Service
3. 将 Service 返回值用于 `setData()` 更新 UI

```javascript
// 重构后的 camera.js 示例结构
Page({
  data: { hasResult: false, isRecognizing: false },

  async onTakePhoto() {
    const filePath = await this.takePhotoWithUI(); // 纯 UI 操作
    const result = await recognitionService.recognize(filePath);
    this.setData({ recognitionResults: result.data.results, hasResult: true });
  },

  async onConfirm() {
    wx.showLoading({ title: '保存中...' });
    try {
      await saveService.markFound(this.data.recognitionResults[0]);
      wx.switchTab({ url: '/pages/index/index' });
    } catch (error) {
      errorHandler.report(error);
    } finally {
      wx.hideLoading();
    }
  }
});
```

---

## 约束

- 每个 Service < 150 行
- 每个 Service 至少有一个对应的单元测试文件
- Page 总行数 < 200 行（含 lifecycle）
- 不允许 Page 直接调用 `wx.cloud.database()`（数据库操作全部走云函数/Service）

---

## 关联文档

- `AGENT-SOP.md`
- `CONVENTIONS.md`
- `ARCHITECTURE.md`
