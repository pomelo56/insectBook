// app.js
// 导入缓存刷新工具
import { forceRefreshAllCaches } from './utils/imageHelper.js';

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-8ggzed032ed5e7ec', // 确保这是你的正确环境ID
        traceUser: true,
      });
    }

    this.globalData = {
      // 添加标记，用于指示是否从相机页面跳转过来
      fromCameraPage: false,
      // 添加标记，用于指示是否需要刷新首页数据
      needRefreshHomePage: false,
      // 存储新添加的昆虫信息，用于首页立即显示
      newAddedInsect: null,
      // 记录当前版本号，用于图标缓存更新
      appVersion: '0.2.2' // 样式修复，简洁风格版本
    };
    
    // 获取用户openid
    this.getOpenid();
    
    // 添加UpdateManager功能，检测并提示更新
    this.checkUpdate();
  },
  
  // 检查小程序更新
  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      // 检查是否有新版本
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          console.log('发现新版本');
          
          // 下载新版本
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已下载完成，是否立即重启小程序？',
              showCancel: false,
              success: function(res) {
                if (res.confirm) {
                  // 更新前强制刷新所有缓存
                  forceRefreshAllCaches();
                  // 强制重启并使用新版本
                  updateManager.applyUpdate();
                }
              }
            });
          });
          
          // 新版本下载失败
          updateManager.onUpdateFailed(function() {
            wx.showModal({
              title: '更新失败',
              content: '新版本下载失败，请删除小程序后重新搜索打开',
              showCancel: false
            });
          });
        }
      });
    }
  },

  getOpenid: function() {
    const that = this;
    wx.cloud.callFunction({
      name: 'getOpenId',
      success: function(res) {
        that.globalData.openid = res.result.openid;
        console.log('获取到openid:', that.globalData.openid);
      },
      fail: function(err) {
        console.error('获取openid失败:', err);
      }
    });
  }
});