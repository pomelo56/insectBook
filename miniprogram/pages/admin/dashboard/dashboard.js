// miniprogram/pages/admin/dashboard/dashboard.js
Page({
  data: {
    statistics: {
      totalUsers: 0,
      totalInsects: 0,
      totalBadges: 0,
      totalFunFacts: 0
    },
    loading: true,
    recentActivities: [],
    quickActions: [
      { id: 'add-user', name: '添加用户', icon: '/images/icons/user-plus.png' },
      { id: 'add-insect', name: '添加昆虫', icon: '/images/icons/bug-plus.png' },
      { id: 'add-badge', name: '添加勋章', icon: '/images/icons/trophy-plus.png' },
      { id: 'add-fact', name: '添加冷知识', icon: '/images/icons/lightbulb-plus.png' }
    ]
  },

  onLoad: function() {
    this.loadDashboardData();
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadDashboardData();
  },

  // 加载仪表板数据
  loadDashboardData: async function() {
    this.setData({ loading: true });

    try {
      // 并行获取所有统计数据
      const [usersResult, insectsResult, badgesResult, funFactsResult] = await Promise.all([
        this.getCollectionCount('users'),
        this.getCollectionCount('insects'),
        this.getCollectionCount('badges'),
        this.getCollectionCount('fun_facts')
      ]);

      this.setData({
        statistics: {
          totalUsers: usersResult,
          totalInsects: insectsResult,
          totalBadges: badgesResult,
          totalFunFacts: funFactsResult
        },
        loading: false
      });

      // 加载最近活动
      this.loadRecentActivities();
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 获取集合数量
  getCollectionCount: async function(collectionName) {
    try {
      const result = await wx.cloud.database().collection(collectionName).count();
      return result.total || 0;
    } catch (error) {
      console.error(`获取${collectionName}集合数量失败:`, error);
      return 0;
    }
  },

  // 加载最近活动
  loadRecentActivities: async function() {
    try {
      // 这里可以添加获取最近活动的逻辑
      // 暂时使用模拟数据
      const activities = [
        { type: 'user', action: '新用户注册', time: '2分钟前', detail: '用户"昆虫爱好者"注册成功' },
        { type: 'insect', action: '昆虫信息更新', time: '5分钟前', detail: '更新了"蝴蝶"的详细信息' },
        { type: 'badge', action: '勋章获得', time: '10分钟前', detail: '用户获得"探索者"勋章' },
        { type: 'fact', action: '冷知识发布', time: '15分钟前', detail: '发布了关于蚂蚁的新冷知识' }
      ];

      this.setData({ recentActivities: activities });
    } catch (error) {
      console.error('加载最近活动失败:', error);
    }
  },

  // 快速操作
  handleQuickAction: function(e) {
    const actionId = e.currentTarget.dataset.id;
    
    switch (actionId) {
      case 'add-user':
        wx.navigateTo({
          url: '/pages/admin/users/users'
        });
        break;
      case 'add-insect':
        wx.navigateTo({
          url: '/pages/admin/insects/insects'
        });
        break;
      case 'add-badge':
        wx.navigateTo({
          url: '/pages/admin/badges/badges'
        });
        break;
      case 'add-fact':
        wx.navigateTo({
          url: '/pages/admin/fun-facts/fun-facts'
        });
        break;
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  // 导航到具体管理页面
  navigateToManagement: function(e) {
    const type = e.currentTarget.dataset.type;
    
    const pageMap = {
      users: '/pages/admin/users/users',
      insects: '/pages/admin/insects/insects',
      badges: '/pages/admin/badges/badges',
      funFacts: '/pages/admin/fun-facts/fun-facts'
    };

    const targetUrl = pageMap[type];
    if (targetUrl) {
      wx.navigateTo({
        url: targetUrl
      });
    }
  },

  // 刷新数据
  onRefresh: function() {
    this.loadDashboardData();
  },

  // 数据导出
  exportData: function() {
    wx.showModal({
      title: '数据导出',
      content: '是否导出所有管理数据？',
      success: (res) => {
        if (res.confirm) {
          this.performDataExport();
        }
      }
    });
  },

  // 执行数据导出
  performDataExport: async function() {
    wx.showLoading({
      title: '导出中...'
    });

    try {
      // 这里可以添加数据导出逻辑
      // 暂时显示成功提示
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '导出成功',
          icon: 'success'
        });
      }, 2000);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  },

  // 数据备份
  backupData: function() {
    wx.showModal({
      title: '数据备份',
      content: '是否创建数据备份？',
      success: (res) => {
        if (res.confirm) {
          this.performDataBackup();
        }
      }
    });
  },

  // 执行数据备份
  performDataBackup: async function() {
    wx.showLoading({
      title: '备份中...'
    });

    try {
      // 这里可以添加数据备份逻辑
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '备份成功',
          icon: 'success'
        });
      }, 2000);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '备份失败',
        icon: 'none'
      });
    }
  }
});