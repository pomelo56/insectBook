// 获取用户openid的云函数
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  try {
    console.log('getUserOpenid 云函数开始执行');
    
    // 获取用户的openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const appid = wxContext.APPID;
    const env = wxContext.ENV;
    
    console.log('用户信息:', {
      openid: openid,
      appid: appid,
      env: env
    });
    
    return {
      success: true,
      openid: openid,
      appid: appid,
      env: env,
      message: '获取用户openid成功'
    };
    
  } catch (error) {
    console.error('获取用户openid失败:', error);
    return {
      success: false,
      error: error.message,
      message: '获取用户openid失败'
    };
  }
};