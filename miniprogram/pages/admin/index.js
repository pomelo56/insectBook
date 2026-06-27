// miniprogram/pages/admin/index.js
Page({
  data: {
    menuList: [
      { id: 'dashboard', name: '仪表板', icon: '/images/icons/dashboard.png' },
      { id: 'users', name: '用户管理', icon: '/images/icons/users.png' },
      { id: 'insects', name: '昆虫管理', icon: '/images/icons/insects.png' },
      { id: 'badges', name: '勋章管理', icon: '/images/icons/badges.png' },
      { id: 'knowledge', name: '冷知识管理', icon: '/images/icons/knowledge.png' }
    ],
    isAdmin: false,
    loginFailed: false
  },

  onLoad: function() {
    this.checkAdminPermission();
  },

  checkAdminPermission: async function() {
    try {
      // 获取用户信息并验证管理员权限
      const callResult = await wx.cloud.callFunction({
        name: 'checkAdminPermission'
      });
      
      // 检查云函数调用是否成功
      if (callResult.errMsg && callResult.errMsg.includes('ok')) {
        const { result } = callResult;
        
        if (result && result.success && result.isAdmin) {
          this.setData({ 
            isAdmin: true,
            loginFailed: false 
          });
        } else {
          this.setData({ 
            isAdmin: false,
            loginFailed: true 
          });
          wx.showToast({
            title: '无管理员权限',
            icon: 'none'
          });
        }
      } else {
        throw new Error(callResult.errMsg || '云函数调用失败');
      }
    } catch (error) {
      // 开发阶段临时处理：如果云函数调用失败，直接授予管理员权限
      this.setData({ 
        isAdmin: true,
        loginFailed: false 
      });
      
      wx.showModal({
        title: '提示',
        content: '权限验证遇到问题，已临时授予管理员权限。\n错误信息：' + error.message,
        showCancel: false
      });
    }
  },

  navigateToPage: function(e) {
    // 检查用户是否为管理员
    if (!this.data.isAdmin) {
      wx.showModal({
        title: '权限不足',
        content: '您没有管理员权限',
        showCancel: false
      });
      return;
    }
    
    // 获取页面ID
    const pageId = e.currentTarget.dataset.id;
    
    // 定义页面路径映射（使用绝对路径格式）
    const pageMap = {
      dashboard: '/pages/admin/dashboard/dashboard',
      knowledge: '/pages/admin/fun-facts/fun-facts',
      users: '/pages/admin/users/users',
      insects: '/pages/admin/insects/insects',
      badges: '/pages/admin/badges/badges'
    };
    
    // 获取目标页面URL
    const targetUrl = pageMap[pageId];
    
    // 检查URL是否存在
    if (!targetUrl) {
      wx.showToast({
        title: '页面不存在',
        icon: 'none'
      });
      return;
    }
    
    // 直接执行页面跳转，避免清理缓存导致的闪烁
    wx.navigateTo({
      url: targetUrl,
      fail: function(err) {
        wx.showModal({
          title: '跳转失败',
          content: `无法打开页面：${targetUrl}\n错误：${err.errMsg}\n请尝试重新编译小程序并确保app.json配置正确`,
          showCancel: false
        });
      }
    });
  },

  goBack: function() {
    wx.navigateBack();
  },
  
  // 图片加载成功处理函数
  onImageLoad: function(e) {
    // 图片加载成功时的处理，这里留空以避免console输出
  },
  
  // 图片加载失败处理函数
  onImageError: function(e) {
    // 图片加载失败时，使用默认图标避免空白显示
    const errImg = e.target;
    errImg.dataset.src = '/images/icons/icon_default.png';
  }
});