// app.js
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

    this.globalData = {};
    
    // 获取用户openid
    this.getOpenid();
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