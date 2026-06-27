// 删除冷知识云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { factId } = event;
    
    if (!factId) {
      return {
        success: false,
        message: '缺少冷知识ID'
      };
    }
    
    // 执行删除操作
    await db.collection('fun_facts').doc(factId).remove();
    
    // 暂时注释掉操作日志记录，避免集合不存在的错误
    // await db.collection('admin_operations').add({
    //   data: {
    //     operator: context.OPENID,
    //     action: 'delete_fun_fact',
    //     factId: factId,
    //     timestamp: db.serverDate()
    //   }
    // });
    
    return {
      success: true,
      message: '冷知识删除成功'
    };
  } catch (error) {
    console.error('删除冷知识失败:', error);
    return {
      success: false,
      message: '删除失败',
      error: error.message
    };
  }
};