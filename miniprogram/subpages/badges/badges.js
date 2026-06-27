// pages/badges/badges.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    totalFoundCount: 0, // 初始值，将从实际数据获取
    totalTargetCount: 200, // 临时设定的目标发现数量
    levels: [], // 从数据库加载的勋章配置
    isLoading: true // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 优先从缓存加载勋章配置
    const cachedBadges = wx.getStorageSync('cached_badges');
    if (cachedBadges) {
      this.setData({
        levels: cachedBadges.levels,
        totalTargetCount: cachedBadges.totalTargetCount || 200,
        isLoading: false // 有缓存时立即显示
      });
      // 后台加载最新数据
      this.loadBadgesFromDatabase();
    } else {
      // 缓存不存在时，保持加载状态直到数据库数据加载完成
      this.setData({ isLoading: true });
      // 直接从数据库加载，不显示默认配置
      this.loadBadgesFromDatabase();
    }
  },

  /**
   * 从数据库加载勋章配置
   */
  async loadBadgesFromDatabase() {
    try {
      console.log('===== 开始从数据库加载勋章配置 =====');
      
      const result = await wx.cloud.callFunction({
        name: 'getBadgeList',
        data: { 
          pageNum: 1, 
          pageSize: 50  // 获取所有勋章配置
        }
      });
      
      console.log('数据库勋章配置加载结果:', result);
      
      if (result.result && result.result.success && result.result.badges.length > 0) {
        const badges = result.result.badges;
        
        // 将数据库勋章配置转换为前端格式
        const levels = badges.map((badge, index) => ({
          level: badge.id || badge._id,
          name: badge.name,
          levelName: badge.level || '', // 勋章等级名称
          icon: badge.icon || '/images/icons/bug1.svg', // 使用数据库图标或默认图标
          targetCount: badge.requiredCount || 1,
          currentCount: 0,
          isCompleted: false,
          description: '未达成',
          isCurrentLevel: false,
          progressPercentage: 0,
          badgeId: badge.id || badge._id
        }));
        
        // 按所需数量排序
        levels.sort((a, b) => a.targetCount - b.targetCount);
        
        // 计算总目标数量（最高等级的目标数量）
        const totalTargetCount = levels.length > 0 ? Math.max(...levels.map(l => l.targetCount)) : 200;
        
        // 缓存数据
        const cacheData = {
          levels: levels,
          totalTargetCount: totalTargetCount,
          timestamp: Date.now()
        };
        
        wx.setStorageSync('cached_badges', cacheData);
        
        // 更新UI
        this.setData({
          levels: levels,
          totalTargetCount: totalTargetCount,
          isLoading: false
        });
        
        // 重新计算进度
        this.loadUserProgress();
        
        console.log('成功从数据库加载勋章配置:', levels.length + '个勋章');
      } else {
        console.log('数据库中没有勋章配置，使用默认配置');
        this.loadDefaultBadges();
      }
    } catch (error) {
      console.error('从数据库加载勋章配置失败:', error);
      // 数据库加载失败时，使用默认配置
      this.loadDefaultBadges();
      // 确保加载状态关闭
      this.setData({ isLoading: false });
    }
  },
  
  /**
   * 加载默认勋章配置（备用方案）
   */
  loadDefaultBadges() {
    try {
      console.log('===== 使用默认勋章配置 =====');
      
      const defaultLevels = [
        {
          level: 1,
          name: '昆虫萌新',
          levelName: '入门',
          icon: '/images/icons/bug1.svg',
          targetCount: 1,
          currentCount: 0,
          isCompleted: false,
          description: '未达成',
          isCurrentLevel: false,
          progressPercentage: 0
        },
        {
          level: 2,
          name: '昆虫探索者', 
          levelName: '初级',
          icon: '/images/icons/bug1.svg',
          targetCount: 5,
          currentCount: 0,
          isCompleted: false,
          description: '未达成',
          isCurrentLevel: false,
          progressPercentage: 0
        },
        {
          level: 3,
          name: '好奇观察者',
          levelName: '中级', 
          icon: '/images/icons/bug2.svg',
          targetCount: 15,
          currentCount: 0,
          isCompleted: false,
          description: '未达成',
          isCurrentLevel: false,
          progressPercentage: 0
        },
        {
          level: 4,
          name: '田野侦探',
          levelName: '高级',
          icon: '/images/icons/bug3.svg',
          targetCount: 30,
          currentCount: 0,
          isCompleted: false,
          description: '未达成',
          isCurrentLevel: false,
          progressPercentage: 0
        },
        {
          level: 5,
          name: '昆虫爱好者',
          levelName: '专家',
          icon: '/images/icons/bug4.svg', 
          targetCount: 50,
          currentCount: 0,
          isCompleted: false,
          description: '未达成',
          isCurrentLevel: false,
          progressPercentage: 0
        }
      ];
      
      this.setData({
        levels: defaultLevels,
        totalTargetCount: 200,
        isLoading: false
      });
      
      // 加载用户进度并计算进度
      this.loadUserProgress();
      
      console.log('默认勋章配置加载完成');
    } catch (error) {
      console.error('加载默认勋章配置失败:', error);
      this.setData({ isLoading: false });
    }
  },
  
  /**
   * 加载用户实际发现的昆虫数量
   */
  loadUserProgress: function() {
    const db = wx.cloud.database();
    const _ = db.command;
    const app = getApp();
    
    // 首先从缓存加载，立即显示
    const cachedCount = wx.getStorageSync('collectedCount');
    if (cachedCount && cachedCount > 0) {
      this.setData({
        totalFoundCount: cachedCount
      });
      this.calculateProgress();
      console.log('从缓存加载显示:', cachedCount);
    }
    
    // 然后从数据库加载最新数据
    const openid = app.globalData.openid || wx.getStorageSync('openid');
    
    if (openid) {
      console.log('开始从数据库加载最新数据...');
      // 查询用户发现的昆虫数量
      db.collection('user_insects')
        .where({
          _openid: openid
        })
        .field({
          insectId: true
        })
        .get()
        .then(res => {
          // 从数据中提取唯一的insectId并计算数量
          const uniqueInsectIds = new Set();
          res.data.forEach(item => {
            uniqueInsectIds.add(item.insectId);
          });
          
          const actualFoundCount = uniqueInsectIds.size;
          
          this.setData({
            totalFoundCount: actualFoundCount
          });
          
          // 更新缓存
          wx.setStorageSync('collectedCount', actualFoundCount);
          
          console.log('从数据库加载最新数量:', actualFoundCount);
          this.calculateProgress();
        })
        .catch(err => {
          console.error('获取用户发现数量失败:', err);
          // 出错时使用缓存或默认值
          this.calculateProgress();
        });
    } else {
      console.error('未找到用户openid');
      // 出错时使用默认值
      this.calculateProgress();
    }
  },

  /**
   * 计算进度条和等级状态
   */
  calculateProgress: function() {
    const { totalFoundCount, levels } = this.data;
    
    console.log('[勋章调试] 开始计算勋章进度，总发现数量:', totalFoundCount);
    
    // 更新每个勋章的进度
    const updatedLevels = levels.map(levelItem => {
      const currentCount = Math.min(totalFoundCount, levelItem.targetCount);
      const isCompleted = totalFoundCount >= levelItem.targetCount;
      
      return {
        ...levelItem,
        currentCount,
        isCompleted,
        progressPercentage: Math.min((currentCount / levelItem.targetCount) * 100, 100)
      };
    });
    
    // 找出当前勋章索引（已完成的最高等级的索引）
    let currentLevelIndex = -1;
    console.log('[勋章调试] 检查各勋章完成状态:', updatedLevels.map(l => ({name: l.name, isCompleted: l.isCompleted})));
    
    for (let i = updatedLevels.length - 1; i >= 0; i--) {
      if (updatedLevels[i].isCompleted) {
        currentLevelIndex = i;
        break;
      }
    }
    
    console.log('[勋章调试] 当前勋章索引:', currentLevelIndex);
    
    // 再次遍历，设置当前勋章标识和描述
    // 创建一个全新的数组，确保不会有遗留的状态
    const finalLevels = updatedLevels.map((levelItem, index) => {
      let description = '未达成';
      let isCurrentLevel = false;
      
      if (levelItem.isCompleted) {
        description = '已达成';
      }
      
      // 只有当前勋章（已完成的最高等级）才能显示为'当前等级'
      // 强制确保只有一个勋章是当前等级
      if (index === currentLevelIndex && currentLevelIndex >= 0) {
        isCurrentLevel = true;
        description = '当前等级';
      }
      
      // 确保返回一个完全新的对象，避免引用问题
      return {
        level: levelItem.level,
        name: levelItem.name,
        levelName: levelItem.levelName || '', // 保持等级名称
        icon: levelItem.icon,
        targetCount: levelItem.targetCount,
        currentCount: levelItem.currentCount,
        isCompleted: levelItem.isCompleted,
        description: description,
        isCurrentLevel: isCurrentLevel,
        progressPercentage: levelItem.progressPercentage,
        badgeId: levelItem.badgeId // 保持badgeId
      };
    });
    
    // 输出最终勋章状态，重点关注isCurrentLevel标记
    console.log('[勋章调试] 最终勋章状态:', finalLevels.map(l => ({
      name: l.name,
      levelName: l.levelName,
      description: l.description,
      isCurrentLevel: l.isCurrentLevel,
      isCompleted: l.isCompleted,
      targetCount: l.targetCount
    })));
    
    this.setData({
      levels: finalLevels,
      progressPercentage: Math.min((totalFoundCount / this.data.totalTargetCount) * 100, 100)
    });
  },

  /**
   * 返回上一页
   */
  onBackTap: function() {
    wx.navigateBack();
  },

  /**
   * 跳转到相机页面
   */// 发现昆虫按钮点击事件
  onCameraTap: function() {
    // 跳转到发现昆虫页（底部标签栏页面）
    wx.switchTab({
      url: '/pages/camera/camera'
    });
  }
})