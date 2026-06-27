// 删除勋章云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { badgeId } = event;
    
    if (!badgeId) {
      return {
        success: false,
        message: '缺少勋章ID'
      };
    }
    
    // 执行删除操作
    await db.collection('badges').doc(badgeId).remove();
    
    // 暂时注释掉操作日志记录，避免集合不存在的错误
    // // 记录操作日志
    // await db.collection('admin_operations').add({
    //   data: {
    //     operator: context.OPENID,
    //     action: 'delete_badge',
    //     badgeId: badgeId,
    //     timestamp: db.serverDate()
    //   }
    // });
    
    return {
      success: true,
      message: '勋章删除成功'
    };
  } catch (error) {
    console.error('删除勋章失败:', error);
    return {
      success: false,
      message: '删除失败',
      error: error.message
    };
  }
};","}}}