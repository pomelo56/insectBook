// pages/badges/badges.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    totalFoundCount: 0, // 初始值，将从实际数据获取
    totalTargetCount: 200, // 临时设定的目标发现数量
    levels: [
      {
        level: 1,
        name: '昆虫萌新',
        icon: '/images/icons/bug1.svg', // SVG格式图标
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
        description: '未达成'
      },
      {
        level: 2,
        name: '昆虫探索者',
        icon: '/images/icons/bug1.svg', // SVG格式图标
        targetCount: 5,
        currentCount: 0,
        isCompleted: false,
        description: '未达成'
      },
      {
        level: 5,
        name: '好奇观察者',
        icon: '/images/icons/bug2.svg', // SVG格式图标
        targetCount: 15,
        currentCount: 0,
        isCompleted: false,
        description: '未达成'
      },
      {
        level: 15,
        name: '田野侦探',
        icon: '/images/icons/bug3.svg', // SVG格式图标
        targetCount: 30,
        currentCount: 0,
        isCompleted: false,
        description: '未达成'
      },
      {
        level: 30,
        name: '昆虫爱好者',
        icon: '/images/icons/bug4.svg', // SVG格式图标
        targetCount: 50,
        currentCount: 0,
        isCompleted: false,
        description: '未达成'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从本地缓存或云数据库获取实际发现的昆虫数量
    this.loadUserProgress();
  },

  /**
   * 加载用户实际发现的昆虫数量
   */
  loadUserProgress: function() {
    const db = wx.cloud.database();
    const _ = db.command;
    const app = getApp();
    
    // 首先尝试从本地缓存获取
    const collectedCount = wx.getStorageSync('collectedCount');
    if (collectedCount && collectedCount > 0) {
      this.setData({
        totalFoundCount: collectedCount
      });
      this.calculateProgress();
      console.log('从本地缓存获取用户发现数量:', collectedCount);
      return;
    }
    
    // 如果本地缓存没有，从云数据库获取（与首页使用相同的集合）
    // 获取当前用户的openid
    const openid = app.globalData.openid || wx.getStorageSync('openid');
    
    if (openid) {
      // 查询用户发现的昆虫数量（与首页使用相同的集合：user_insects）
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
          
          // 保存到本地缓存
          wx.setStorageSync('collectedCount', actualFoundCount);
          
          console.log('从数据库获取用户发现数量:', actualFoundCount);
          this.calculateProgress();
        })
        .catch(err => {
          console.error('获取用户发现数量失败:', err);
          // 出错时使用默认值
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
    
    console.log('[等级调试] 开始计算等级进度，总发现数量:', totalFoundCount);
    
    // 更新每个等级的进度
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
    
    // 找出当前等级索引（已完成的最高等级的索引）
    let currentLevelIndex = -1;
    console.log('[等级调试] 检查各等级完成状态:', updatedLevels.map(l => ({level: l.level, isCompleted: l.isCompleted})));
    
    for (let i = updatedLevels.length - 1; i >= 0; i--) {
      if (updatedLevels[i].isCompleted) {
        currentLevelIndex = i;
        break;
      }
    }
    
    console.log('[等级调试] 当前等级索引:', currentLevelIndex);
    
    // 再次遍历，设置当前等级标识和描述
    // 创建一个全新的数组，确保不会有遗留的状态
    const finalLevels = updatedLevels.map((levelItem, index) => {
      let description = '未达成';
      let isCurrentLevel = false;
      
      if (levelItem.isCompleted) {
        description = '已达成';
      }
      
      // 只有当前等级（已完成的最高等级）才能显示为'当前等级'
      // 强制确保只有一个等级是当前等级
      if (index === currentLevelIndex && currentLevelIndex >= 0) {
        isCurrentLevel = true;
        description = '当前等级';
      }
      
      // 确保返回一个完全新的对象，避免引用问题
      return {
        level: levelItem.level,
        name: levelItem.name,
        icon: levelItem.icon,
        targetCount: levelItem.targetCount,
        currentCount: levelItem.currentCount,
        isCompleted: levelItem.isCompleted,
        description: description,
        isCurrentLevel: isCurrentLevel,
        progressPercentage: levelItem.progressPercentage
      };
    });
    
    // 输出最终等级状态，重点关注isCurrentLevel标记
    console.log('[等级调试] 最终等级状态:', finalLevels.map(l => ({
      level: l.level,
      name: l.name,
      description: l.description,
      isCurrentLevel: l.isCurrentLevel,
      isCompleted: l.isCompleted
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
      url: '/pages/discovery/discovery'
    });
  }
})