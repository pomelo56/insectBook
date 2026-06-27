// 更新昆虫图片云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { insectId, imageUrl, externalId } = event;
    
    // 参数验证
    if (!imageUrl) {
      return {
        success: false,
        message: '缺少图片URL参数'
      };
    }
    
    if (!insectId && !externalId) {
      return {
        success: false,
        message: '缺少昆虫ID参数'
      };
    }
    
    let targetInsectId;
    
    // 优先使用externalId查询
    if (externalId) {
      // 使用externalId查询对应的昆虫记录
      const insectByExternalId = await db.collection('insects')
        .where({ externalId: externalId })
        .field({ _id: true })
        .get();
      
      if (insectByExternalId.data && insectByExternalId.data.length > 0) {
        targetInsectId = insectByExternalId.data[0]._id;
      } else {
        return {
          success: false,
          message: '未找到对应externalId的昆虫记录'
        };
      }
    } else {
      // 使用insectId（可能是数据库_id）
      targetInsectId = insectId;
    }
    
    // 更新昆虫图片信息
    const result = await db.collection('insects').doc(targetInsectId).update({
      data: {
        imageUrl: imageUrl,
        updateTime: db.serverDate()
      }
    });
    
    // 记录操作日志
    // 暂时注释掉操作日志记录，避免集合不存在的错误
    // await db.collection('admin_operations').add({
    //   data: {
    //     operator: context.OPENID,
    //     action: 'update_insect_image',
    //     insectId: insectId,
    //     timestamp: db.serverDate()
    //   }
    // });
    
    return {
      success: true,
      message: '图片更新成功',
      updated: result.stats.updated
    };
  } catch (error) {
    console.error('更新昆虫图片失败:', error);
    return {
      success: false,
      message: '图片更新失败',
      error: error.message
    };
  }
};