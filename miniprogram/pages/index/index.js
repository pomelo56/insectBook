// pages/index/index.js
const app = getApp();

// Service 层
const insectService = require('../../services/insectService');

// Utils 层
import { getBaiduImageUrl, clearImageCache } from '../../utils/imageHelper.js';
// 引入昆虫冷知识数据（暂时保留本地数据作为备用）
import { insectColdKnowledge, clothingTips, observationTips } from '../../utils/insectColdKnowledge.js';

Page({
  data: {
    collectedCount: 0,
    totalCount: 0,
    progressPercent: 0,
    recentInsects: [],
    currentBadge: {},
    // 昆虫冷知识相关数据
    currentKnowledge: {},
    clothingTip: '',
    observationTip: '',
    isTransitioning: false,
    // 管理权限相关
    isAdmin: false,
    showAdminEntrance: false,
    isLoadingAdminCheck: true,
    // 分页相关
    currentPage: 1,
    pageSize: 10, // 统一的分页大小
    hasMoreData: true
  },

  async onLoad() {
    // 初始化防止重复加载的标记
    this._isLoading = false;
    
    // 仅在版本更新或首次启动时清除缓存
    const appVersion = app.globalData.version || '1.0.0';
    const cachedVersion = wx.getStorageSync('cached_app_version');
    if (appVersion !== cachedVersion) {
      clearImageCache();
      wx.setStorageSync('cached_app_version', appVersion);
      console.log('应用版本变化，已清除缓存');
    }
    
    // 优先加载缓存的等级信息，避免等待数据加载时显示空白
    this.loadCachedLevel();
    
    // 初始化等级配置（异步加载）
    this.loadUserLevelConfig().then(config => {
      // 配置加载完成后，重新计算用户等级
      this.updateUserLevelWithConfig(this.data.collectedCount, config);
    });
    
    this._loadInsectData();
    this.initColdKnowledge();
    // 启动自动切换定时器
    this.startKnowledgeTimer();
    
    // 检查管理员权限
    this.checkAdminPermission();
  },
  
  // 加载缓存的等级信息
  loadCachedLevel() {
    try {
      const cachedLevel = wx.getStorageSync('cached_user_level');
      if (cachedLevel) {
        this.setData({
          currentBadge: cachedLevel
        });
      }
    } catch (e) {
      console.error('加载缓存等级失败:', e);
    }
  },
  
  // 初始化昆虫冷知识
  initColdKnowledge() {
    // 优先从缓存加载冷知识
    const cachedKnowledge = wx.getStorageSync('cached_cold_knowledge');
    if (cachedKnowledge) {
      this.setData({
        currentKnowledge: cachedKnowledge.knowledge,
        clothingTip: cachedKnowledge.clothingTip,
        observationTip: cachedKnowledge.observationTip
      });
      // 后台加载最新数据
      this.loadColdKnowledgeFromDatabase();
    } else {
      // 缓存不存在时，先显示本地数据，然后加载数据库数据
      this.loadLocalColdKnowledge();
      this.loadColdKnowledgeFromDatabase();
    }
  },
  
  // 从数据库加载冷知识
  async loadColdKnowledgeFromDatabase() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getFunFactsList',
        data: { 
          pageNum: 1, 
          pageSize: 50  // 获取足够数量的冷知识
        }
      });
      
      if (result.result && result.result.success && result.result.funFacts.length > 0) {
        const funFacts = result.result.funFacts;
        
        // 随机选择一条冷知识
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        const selectedFact = funFacts[randomIndex];
        
        // 构建冷知识数据结构
        const knowledgeData = {
          id: selectedFact.id || selectedFact._id,
          category: '管理后台冷知识',
          content: selectedFact.content,
          related_insects: selectedFact.insectName ? selectedFact.insectName.split(',').map(name => name.trim()) : [],
          seasonal_tips: []
        };
        
        // 随机选择观察提示和衣物建议（使用本地数据）
        const randomObservationTip = observationTips[Math.floor(Math.random() * observationTips.length)];
        const clothingAdvice = clothingTips.general_advice || clothingTips[Math.floor(Math.random() * clothingTips.length)];
        
        // 缓存数据
        const cacheData = {
          knowledge: knowledgeData,
          clothingTip: clothingAdvice,
          observationTip: randomObservationTip,
          timestamp: Date.now()
        };
        
        wx.setStorageSync('cached_cold_knowledge', cacheData);
        
        // 更新UI
        this.setData({
          currentKnowledge: knowledgeData,
          clothingTip: clothingAdvice,
          observationTip: randomObservationTip
        });
      } else {
        this.loadLocalColdKnowledge();
      }
    } catch (error) {
      // 数据库加载失败时，使用本地数据
      this.loadLocalColdKnowledge();
    }
  },
  
  // 加载本地冷知识（备用方案）
  loadLocalColdKnowledge() {
    try {
      // 随机选择一条冷知识
      const randomIndex = Math.floor(Math.random() * insectColdKnowledge.length);
      const randomKnowledge = insectColdKnowledge[randomIndex];
      
      // 随机选择一条观察提示
      const randomObservationTip = observationTips[Math.floor(Math.random() * observationTips.length)];
      
      // 获取衣物建议
      const clothingAdvice = clothingTips.general_advice || clothingTips[Math.floor(Math.random() * clothingTips.length)];
      
      // 确保数据格式完整
      const knowledgeWithDefaults = {
        ...randomKnowledge,
        related_insects: randomKnowledge.related_insects || [],
        seasonal_tips: randomKnowledge.seasonal_tips || []
      };
      
      this.setData({
        currentKnowledge: knowledgeWithDefaults,
        clothingTip: clothingAdvice,
        observationTip: randomObservationTip
      });
    } catch (error) {
      // 设置默认值以防出错
      this.setData({
        currentKnowledge: {
          id: "default",
          category: "默认知识",
          content: "昆虫是地球上种类最多的动物群体",
          related_insects: ["昆虫"],
          seasonal_tips: [{
            month: "全年",
            description: "昆虫在各种环境中都能生存",
            tips: "保持好奇心，发现更多昆虫世界的奥秘",
            active_insects: ["蚂蚁", "蝴蝶"]
          }]
        },
        observationTip: "观察昆虫时保持安静，不要惊吓它们",
        clothingTip: "野外观察昆虫时建议穿长袖衣物"
      });
    }
  },
  
  // 启动自动切换冷知识的定时器
  startKnowledgeTimer() {
    // 清除可能存在的旧定时器
    if (this.knowledgeTimer) {
      clearInterval(this.knowledgeTimer);
    }
    
    // 设置新的定时器，每6秒切换一次冷知识
    this.knowledgeTimer = setInterval(() => {
      this.switchKnowledgeWithTransition();
    }, 6000);
  },
  
  // 带过渡效果的冷知识切换
  switchKnowledgeWithTransition() {
    if (this.data.isTransitioning) return;
    
    this.setData({
      isTransitioning: true
    });
    
    // 等待淡出动画完成后切换内容
    setTimeout(() => {
      this.initColdKnowledge();
      
      // 新内容会自动触发淡入动画
      setTimeout(() => {
        this.setData({
          isTransitioning: false
        });
      }, 50);
    }, 300);
  },
  
  // 清除定时器
  clearKnowledgeTimer() {
    if (this.knowledgeTimer) {
      clearInterval(this.knowledgeTimer);
      this.knowledgeTimer = null;
    }
  },

  async onShow() {
    try {
      // 优先显示缓存的等级信息
      this.loadCachedLevel();
      
      // 确保定时器在页面显示时运行
      this.startKnowledgeTimer();
      
      // 首先从缓存加载数据，确保用户立即看到内容
      this.tryRecoverFromCache();
      
      // 强制刷新：每次 onShow 都加载最新数据
      console.log('页面显示，开始加载最新数据');
      await this._loadInsectData();
      
      // 重置刷新标志
      app.globalData.needRefreshHomePage = false;
      
      // 处理可能的新添加昆虫信息
      if (app.globalData.newAddedInsect) {
        app.globalData.newAddedInsect = null;
      }
    } catch (error) {
      console.error('首页onShow执行失败，尝试恢复基本显示:', error);
      // 确保至少能显示基本页面结构
      this.tryRecoverFromCache();
    }
  },
  
  // 尝试从缓存恢复数据 — 委托给 insectService
  tryRecoverFromCache() {
    try {
      const cacheData = insectService.recoverInsectDataFromCache();
      if (!cacheData) {
        this.setData({
          recentInsects: [], collectedCount: 0, totalCount: 30,
          progressPercent: 0, currentPage: 1, hasMoreData: true
        });
        return false;
      }

      this.setData(cacheData);

      if (cacheData.recentInsects && cacheData.recentInsects.length > 0) {
        console.log('从缓存恢复数据，共', cacheData.collectedCount, '条记录');
        try {
          this.updateUserLevel(false);
        } catch (levelError) {
          console.error('更新用户等级时出错，但不影响数据显示:', levelError);
        }
        return true;
      }

      console.log('缓存数据为空，设置空状态');
      return true;
    } catch (error) {
      console.error('tryRecoverFromCache严重错误，强制设置空状态:', error);
      try {
        this.setData({
          recentInsects: [], collectedCount: 0, totalCount: 30,
          progressPercent: 0, currentPage: 1, hasMoreData: true
        });
      } catch (setDataError) {
        console.error('设置基础数据失败，页面可能无法正常显示:', setDataError);
      }
      return false;
    }
  },
  
  onReady() {
    this.checkAndLoadMissingImages();
  },

  onHide() {
    // 页面隐藏时清除定时器，避免内存泄漏
    this.clearKnowledgeTimer();
  },

  onUnload() {
    // 页面卸载时彻底清除定时器
    this.clearKnowledgeTimer();
  },
  
  // 加载更多数据
  onLoadMore() {
    console.log('触发加载更多');
    if (this.data.hasMoreData) {
      wx.showLoading({ title: '加载中...' });
      this._loadInsectData(true).finally(() => {
        wx.hideLoading();
      });
    } else {
      wx.showToast({ 
        title: '没有更多数据了', 
        icon: 'none'
      });
    }
  },

  /* ---------- 业务函数 ---------- */
  // 加载昆虫数据 — 委托给 insectService，本方法只做防重入 + UI 更新
  async _loadInsectData(isLoadMore = false) {
    console.log('首页昆虫收藏数据加载开始');
    if (this._isLoading && !isLoadMore) {
      console.log('数据加载中，跳过重复请求');
      return;
    }

    this._isLoading = true;

    try {
      if (!app.globalData.openid) {
        console.log('openid未获取，等待并重试');
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!app.globalData.openid) {
          console.warn('openid仍未获取，使用缓存数据');
          this.tryRecoverFromCache();
          return;
        }
      }

      const result = await insectService.loadInsectData({
        openid: app.globalData.openid,
        isLoadMore,
        currentPage: this.data.currentPage,
        pageSize: this.data.pageSize,
        recentInsects: this.data.recentInsects
      });

      if (result.error) {
        console.error('加载昆虫数据失败，尝试缓存恢复:', result.error);
        this.tryRecoverFromCache();
        return;
      }

      this.setData({
        recentInsects: result.records,
        collectedCount: result.collectedCount,
        totalCount: result.totalCount,
        progressPercent: result.progressPercent,
        currentPage: isLoadMore ? this.data.currentPage + 1 : 1,
        hasMoreData: result.hasMore
      });

      this.updateUserLevel(true).catch(e => {
        console.error('更新等级失败但不影响显示:', e);
      });

      console.log('首页数据加载成功，共', result.collectedCount, '种昆虫');

    } catch (error) {
      console.error('_loadInsectData严重错误:', error);
      this.tryRecoverFromCache();
    } finally {
      this._isLoading = false;
    }
  },

  // 从数据库加载用户等级配置
  async loadUserLevelConfig() {
    try {
      console.log('===== 开始从数据库加载用户等级配置 =====');
      
      const result = await wx.cloud.callFunction({
        name: 'getBadgeList',
        data: { 
          pageNum: 1, 
          pageSize: 50 
        }
      });
      
      console.log('数据库用户等级配置加载结果:', result);
      
      if (result.result && result.result.success && result.result.badges.length > 0) {
        const badges = result.result.badges;
        
        // 将数据库勋章配置转换为等级配置格式
        const levelConfig = badges.map(badge => ({
          level: badge.id || badge._id,
          name: badge.name,
          levelName: badge.level || '',
          icon: badge.icon || '/images/icons/bug1.svg',
          requiredCount: badge.requiredCount || 1,
          badgeId: badge.id || badge._id
        }));
        
        // 按所需数量排序
        levelConfig.sort((a, b) => a.requiredCount - b.requiredCount);
        
        // 缓存配置
        const cacheData = {
          levelConfig: levelConfig,
          timestamp: Date.now()
        };
        
        wx.setStorageSync('cached_level_config', cacheData);
        
        console.log('成功从数据库加载用户等级配置:', levelConfig.length + '个等级');
        return levelConfig;
      } else {
        console.log('数据库中没有用户等级配置，使用默认配置');
        return this.getDefaultLevelConfig();
      }
    } catch (error) {
      console.error('从数据库加载用户等级配置失败:', error);
      return this.getDefaultLevelConfig();
    }
  },
  
  // 获取默认等级配置（备用方案）
  getDefaultLevelConfig() {
    return [
      { level: 1, name: '昆虫萌新', levelName: '入门', icon: '/images/icons/bug1.svg', requiredCount: 1, badgeId: 'default_1' },
      { level: 2, name: '昆虫探索者', levelName: '初级', icon: '/images/icons/bug1.svg', requiredCount: 5, badgeId: 'default_2' },
      { level: 3, name: '好奇观察者', levelName: '中级', icon: '/images/icons/bug2.svg', requiredCount: 15, badgeId: 'default_3' },
      { level: 4, name: '田野侦探', levelName: '高级', icon: '/images/icons/bug3.svg', requiredCount: 30, badgeId: 'default_4' },
      { level: 5, name: '昆虫爱好者', levelName: '专家', icon: '/images/icons/bug4.svg', requiredCount: 50, badgeId: 'default_5' }
    ];
  },
  
  updateUserLevel(shouldCache = false) {
    // 优先从缓存加载等级配置
    const cachedConfig = wx.getStorageSync('cached_level_config');
    let levelConfig;
    
    if (cachedConfig && Date.now() - cachedConfig.timestamp < 24 * 60 * 60 * 1000) { // 24小时内使用缓存
      levelConfig = cachedConfig.levelConfig;
      console.log('使用缓存的等级配置');
    } else {
      // 缓存过期或不存在，异步加载最新配置
      this.loadUserLevelConfig().then(config => {
        // 确保在异步加载配置完成后能正确更新UI
        this.setData({ levelConfig: config }, () => {
          this.updateUserLevelWithConfig(this.data.collectedCount, config, shouldCache);
        });
      });
      levelConfig = this.getDefaultLevelConfig(); // 使用默认配置，避免UI空白
      console.log('使用默认等级配置，后台加载最新配置');
    }
    
    // 立即使用当前可用的配置更新等级
    this.updateUserLevelWithConfig(this.data.collectedCount, levelConfig, shouldCache);
  },
  
  // 使用指定配置更新用户等级
  updateUserLevelWithConfig(collectedCount, levelConfig, shouldCache = false) {
    const c = collectedCount;
    console.log(`updateUserLevelWithConfig - 当前收藏数量: ${c}, 配置数量: ${levelConfig.length}`);
    
    // 找到用户当前等级
    let currentLevel = levelConfig[0] || { level: 1, name: '昆虫萌新', icon: '/images/icons/bug1.svg', requiredCount: 1 };
    let nextLevel = null;
    
    for (let i = 0; i < levelConfig.length; i++) {
      const level = levelConfig[i];
      if (c >= level.requiredCount) {
        currentLevel = level;
      } else if (!nextLevel) {
        nextLevel = level;
        break;
      }
    }
    
    // 如果没有找到下一个等级，设置一个默认的下一个目标
    if (!nextLevel) {
      nextLevel = { requiredCount: c + 1 };
    }
    
    // 计算显示的等级数字（在配置数组中的索引+1）
    const displayLevel = levelConfig.indexOf(currentLevel) + 1;
    
    const newBadge = { 
      level: displayLevel, 
      name: currentLevel.name,
      levelName: currentLevel.levelName || '',
      icon: currentLevel.icon, 
      progress: `${c}/${nextLevel.requiredCount}`,
      badgeId: currentLevel.badgeId
    };
    
    console.log(`新等级信息: ${JSON.stringify(newBadge)}`);
    
    // 强制更新UI，确保进度显示正确同步
    this.setData({
      currentBadge: newBadge
    });
    
    // 缓存等级信息
    if (shouldCache) {
      try {
        wx.setStorageSync('cached_user_level', newBadge);
        console.log('等级信息已缓存');
      } catch (e) {
        console.error('缓存等级信息失败:', e);
      }
    }
    
    // 确保进度百分比也同步更新
    if (this.data.totalCount > 0) {
      const progressPercent = Math.max(1, Math.round((c / this.data.totalCount) * 100));
      if (progressPercent !== this.data.progressPercent) {
        this.setData({ progressPercent });
        console.log(`进度百分比已更新: ${progressPercent}%`);
      }
    }
  },

  async checkAndLoadMissingImages() {
    // 限制图片修复的频率，避免过于频繁的请求
    const now = Date.now();
    if (this._lastChecked && now - this._lastChecked < 60000) return; // 1分钟内不重复检查
    this._lastChecked = now;
    
    const list = this.data.recentInsects;
    if (!list || list.length === 0) return;
    
    // 找出所有需要修复图片的昆虫，但限制数量
    const needFix = list.filter(v => !v.imageUrl || v.imageUrl.includes('default')).slice(0, 3); // 一次最多修复3个
    
    if (needFix.length === 0) return;
    
    const tasks = needFix.map(async item => {
      try {
        item.imageUrl = await getBaiduImageUrl(item.name, { source: 'home_fix', requestId: `fix_${Date.now()}` });
      } catch (err) {
        item.imageUrl = '/images/empty_insect.png';
      }
    });
    
    if (tasks.length) {
      await Promise.all(tasks);
      this.setData({ recentInsects: list });
      wx.setStorageSync('recent_insects', list);
    }
  },

  onImageError(e) {
    const idx = e.currentTarget.dataset.index;
    const list = [...this.data.recentInsects];
    const item = list[idx];
    
    // 检查是否已经尝试过重试，避免无限重试
    if (item.imageRetryCount && item.imageRetryCount >= 1) {
      console.log(`已尝试过重试，不再重试: ${item.name}`);
      return;
    }
    
    // 图片加载失败时，立即使用灰态的小程序LOGO避免空白显示
    console.log(`图片加载失败，使用默认图片: ${item.name}`);
    list[idx].imageUrl = '/images/empty_insect.png';
    list[idx].imageRetryCount = (list[idx].imageRetryCount || 0) + 1;
    this.setData({ recentInsects: list });
    
    // 异步尝试重新获取图片，但不立即更新UI，避免闪烁
    const retryGetImage = async () => {
      try {
        // 为避免频繁请求，添加固定延迟
        await new Promise(resolve => setTimeout(resolve, 3000));
        const newImageUrl = await getBaiduImageUrl(item.name, { source: 'home_retry', requestId: `retry_${Date.now()}` });
        // 检查是否仍是同一个item在同一个位置
        if (this.data.recentInsects[idx] && this.data.recentInsects[idx].id === item.id) {
          // 只有获取到有效的图片URL才更新，避免覆盖已显示的默认图片
          if (newImageUrl && !newImageUrl.includes('empty')) {
            list[idx].imageUrl = newImageUrl;
            this.setData({ recentInsects: list });
            wx.setStorageSync('recent_insects', list);
          }
        }
      } catch (err) {
        console.error(`重试获取图片失败: ${item.name}`, err);
        // 静默失败，保持使用默认图片
      }
    };
    
    // 异步执行，不阻塞UI
    retryGetImage();
  },

  goToInsectDetail(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const item = this.data.recentInsects[index];
    const userImg = item.userImageUrl || item.imageUrl || '';   // 用户上传图
    
    // 优先使用externalId进行导航，如果有externalId的话
    const navigationId = item.externalId ? `externalId=${item.externalId}` : `id=${id}`;
    wx.navigateTo({ url: `/subpages/insect-detail/insect-detail?${navigationId}&userImage=${encodeURIComponent(userImg)}` });
  },

  async onInsectLongPress(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const item = this.data.recentInsects[index];
    
    wx.showModal({
      title: '确认删除',
      content: `确定要永久删除"${item.name}"的记录吗？此操作无法撤销。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中' });
            
            // 调用云函数执行硬删除
            const result = await wx.cloud.callFunction({
              name: 'markFound',
              data: {
                action: 'delete',
                insectId: id,
                // 添加用户openid以确保删除操作的正确性
                _openid: wx.getStorageSync('openid')
              }
            });
            
            if (result.result.success) {
              wx.hideLoading();
              
              // 1. 立即从列表中移除删除的昆虫
              const updatedInsects = this.data.recentInsects.filter((_, i) => i !== index);
              
              // 2. 立即更新收集数量和进度百分比
              const updatedCount = Math.max(0, this.data.collectedCount - 1);
              const updatedProgress = insectService.calculateProgress(updatedCount, this.data.totalCount);
              
              // 3. 更新UI显示 - 使用回调函数确保UI更新完成后再显示toast
              this.setData({
                recentInsects: updatedInsects,
                collectedCount: updatedCount,
                progressPercent: updatedProgress
              }, () => {
                // 4. 更新等级勋章
                this.updateUserLevel(true);
                
                // 5. 清除所有相关缓存
                wx.removeStorageSync('recent_insects');
                wx.removeStorageSync('collectedCount');
                wx.removeStorageSync('cached_user_level');
                
                // 6. 重新加载完整数据以确保准确性
                this._loadInsectData();
                
                // 7. 显示删除成功提示
                wx.showToast({ title: '删除成功' });
              });
              
              // 8. 设置全局刷新标志
              getApp().globalData.needRefreshHomePage = true;
              
            } else {
              wx.hideLoading();
              wx.showToast({ 
                title: result.result.message || '删除失败', 
                icon: 'none' 
              });
            }
          } catch (error) {
            wx.hideLoading();
            wx.showToast({ 
              title: '删除失败，请重试', 
              icon: 'none' 
            });
            console.error('删除昆虫记录失败:', error);
          }
        }
      }
    });
  },

  goToCamera() {
    wx.switchTab({ url: '/pages/camera/camera' });
  },

  goToLevelDetail() {
    wx.navigateTo({ url: '/subpages/badges/badges' });
  },



  onPullDownRefresh() {
    console.log('下拉刷新触发');
    
    // 强制清除缓存，确保加载最新数据
    this.clearAllCache();
    
    // 加载最新数据
    this._loadInsectData().finally(() => {
      // 无论加载成功与否，都停止下拉刷新动画
      wx.stopPullDownRefresh();
      console.log('下拉刷新完成');
    });
  },
  
  // 清除所有相关缓存
  clearAllCache() {
    try {
      wx.removeStorageSync('recent_insects');
      wx.removeStorageSync('collectedCount');
      wx.removeStorageSync('cached_user_level');
      wx.removeStorageSync('cached_cold_knowledge');
      console.log('已清除所有相关缓存');
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
  },
  // 检查管理员权限
  async checkAdminPermission() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'checkAdminPermission',
        data: {}
      });
      
      if (result.result && result.result.success) {
        const isAdmin = result.result.isAdmin;
        
            // 只设置管理员相关状态
        this.setData({
          isAdmin: isAdmin,
          showAdminEntrance: isAdmin, // 仅当是管理员时显示入口
          isLoadingAdminCheck: false
        });
      } else {
        this.setData({
          isAdmin: false,
          showAdminEntrance: false,
          isLoadingAdminCheck: false
        });
      }
    } catch (error) {
      this.setData({
        isAdmin: false,
        showAdminEntrance: false,
        showAdminToolsEntrance: false,
        isLoadingAdminCheck: false
      });
    }
  },
  
  // 跳转到管理后台
  goToAdmin() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/admin/index'
    });
  },
  

});