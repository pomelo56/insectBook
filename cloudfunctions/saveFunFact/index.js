// 保存冷知识云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { fact } = event;
    
    if (!fact || !fact.content || !fact.content.trim()) {
      return {
        success: false,
        message: '缺少必要参数或参数无效'
      };
    }
    
    const now = db.serverDate();
    let result;
    
    if (fact.id) {
      // 更新操作
      result = await db.collection('fun_facts').doc(fact.id).update({
        data: {
          content: fact.content.trim(),
          insectName: fact.insectName.trim() || '',
          displayOrder: fact.displayOrder || 0,
          updateTime: now
        }
      });
      
      // 暂时注释掉操作日志记录，避免集合不存在的错误
      // await db.collection('admin_operations').add({
      //   data: {
      //     operator: context.OPENID,
      //     action: 'update_fun_fact',
      //     factId: fact.id,
      //     timestamp: now
      //   }
      // });
    } else {
      // 添加操作
      result = await db.collection('fun_facts').add({
        data: {
          content: fact.content.trim(),
          insectName: fact.insectName.trim() || '',
          displayOrder: fact.displayOrder || 0,
          createTime: now,
          updateTime: now
        }
      });
      
      // 暂时注释掉操作日志记录，避免集合不存在的错误
      // await db.collection('admin_operations').add({
      //   data: {
      //     operator: context.OPENID,
      //     action: 'add_fun_fact',
      //     factId: result._id,
      //     timestamp: now
      //   }
      // });
    }
    
    return {
      success: true,
      message: fact.id ? '冷知识更新成功' : '冷知识添加成功',
      factId: fact.id || result._id
    };
  } catch (error) {
    console.error('保存冷知识失败:', error);
    return {
      success: false,
      message: '保存失败',
      error: error.message
    };
  }
};