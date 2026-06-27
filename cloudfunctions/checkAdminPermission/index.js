// 管理员权限验证云函数
// 云函数：checkAdminPermission
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 管理员微信号配置
const ADMIN_OPENIDS = [
  'okwiZ5QQ9d-EJ_kLgqIZlKxZdQ3g'  // 您的OpenID
];

exports.main = async (event, context) => {
  try {
    console.log('===== checkAdminPermission 开始执行 =====');
    console.log('接收到的参数:', event);
    
    // 获取调用者的 openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    if (!openid) {
      console.log('未获取到用户 openid');
      return {
        success: false,
        message: '未获取到用户信息',
        isAdmin: false
      };
    }
    
    console.log('调用者 openid:', openid);
    
    // 检查是否为管理员
    const isAdmin = ADMIN_OPENIDS.includes(openid);
    
    // 记录管理员验证日志（方便调试）
    try {
      await db.collection('admin_logs').add({
        data: {
          openid: openid,
          isAdmin: isAdmin,
          timestamp: db.serverDate(),
          event: event
        }
      });
    } catch (logError) {
      console.warn('记录日志失败，但不影响主要功能:', logError);
    }
    
    // 如果是获取OpenID模式（用于调试）
    if (event.mode === 'getOpenid') {
      return {
        success: true,
        message: '获取OpenID成功',
        isAdmin: isAdmin,
        openid: openid,
        // 返回当前配置的管理员列表，便于调试
        configuredAdmins: ADMIN_OPENIDS.length,
        isConfigured: isAdmin
      };
    }
    
    if (isAdmin) {
      console.log('管理员验证成功:', openid);
      return {
        success: true,
        message: '管理员验证成功',
        isAdmin: true,
        openid: openid
      };
    } else {
      console.log('非管理员用户:', openid);
      return {
        success: true,
        message: '非管理员用户',
        isAdmin: false,
        openid: openid,
        // 返回提示信息，帮助用户了解如何获得管理员权限
        howToBecomeAdmin: '请将您的OpenID添加到云函数checkAdminPermission的ADMIN_OPENIDS数组中'
      };
    }
    
  } catch (error) {
    console.error('===== checkAdminPermission 执行失败 =====');
    console.error('错误详情:', error);
    
    return {
      success: false,
      message: '权限验证失败',
      isAdmin: false,
      error: error.message
    };
  }
};