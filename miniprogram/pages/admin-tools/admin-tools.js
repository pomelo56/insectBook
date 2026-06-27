// 管理员工具页面
// 页面：/pages/admin-tools/admin-tools.js
Page({
  data: {
    openid: '',
    isAdmin: false,
    isLoading: false,
    message: '',
    configuredAdmins: 0,
    isConfigured: false,
    howToBecomeAdmin: ''
  },

  onLoad() {
    this.checkAdminStatus();
  },

  async checkAdminStatus() {
    try {
      this.setData({ isLoading: true, message: '正在检查管理员权限...' });
      
      const result = await wx.cloud.callFunction({
        name: 'checkAdminPermission',
        data: { mode: 'getOpenid' }
      });
      
      console.log('管理员权限检查结果:', result);
      
      if (result.result && result.result.success) {
        this.setData({
          openid: result.result.openid || '',
          isAdmin: result.result.isAdmin || false,
          message: result.result.message || '检查完成',
          configuredAdmins: result.result.configuredAdmins || 0,
          isConfigured: result.result.isConfigured || false,
          howToBecomeAdmin: result.result.howToBecomeAdmin || ''
        });
        
        // 如果不是管理员，显示提示信息
        if (!result.result.isAdmin) {
          this.setData({
            message: '您不是管理员，请按照以下说明配置权限: ' + (result.result.howToBecomeAdmin || '')
          });
        } else {
          this.setData({ message: '您已被配置为管理员！' });
        }
      } else {
        throw new Error(result.result?.message || '权限检查失败');
      }
    } catch (error) {
      console.error('检查管理员权限失败:', error);
      this.setData({
        isLoading: false,
        message: '检查失败: ' + error.message
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  copyOpenid() {
    if (this.data.openid) {
      wx.setClipboardData({
        data: this.data.openid,
        success: () => {
          wx.showToast({
            title: 'OpenID已复制',
            icon: 'success'
          });
        },
        fail: () => {
          wx.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    }
  },

  refresh() {
    this.checkAdminStatus();
  },

  goToAdminPage() {
    if (this.data.isAdmin) {
      wx.navigateTo({
        url: '/pages/admin/dashboard/dashboard'
      });
    } else {
      wx.showToast({
        title: '您没有管理员权限',
        icon: 'none'
      });
    }
  }
});