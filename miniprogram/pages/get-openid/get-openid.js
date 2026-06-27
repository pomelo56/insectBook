// 获取OpenID页面
// 页面：/pages/get-openid/get-openid.js
const cloud = require('wx-server-sdk');

Page({
  data: {
    openid: '',
    isLoading: true,
    showCopyButton: false
  },

  onLoad() {
    this.getOpenid();
  },

  async getOpenid() {
    try {
      this.setData({ isLoading: true });
      
      const result = await wx.cloud.callFunction({
        name: 'getOpenid',
        data: {}
      });
      
      if (result.result && result.result.openid) {
        this.setData({
          openid: result.result.openid,
          isLoading: false,
          showCopyButton: true
        });
        
        console.log('获取到的OpenID:', result.result.openid);
      } else {
        throw new Error('获取OpenID失败');
      }
    } catch (error) {
      console.error('获取OpenID失败:', error);
      this.setData({
        isLoading: false,
        openid: '获取失败，请重试',
        showCopyButton: false
      });
    }
  },

  copyOpenid() {
    if (this.data.openid && this.data.openid !== '获取失败，请重试') {
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

  goBack() {
    wx.navigateBack();
  }
});