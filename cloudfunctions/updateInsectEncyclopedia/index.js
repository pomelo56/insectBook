// 云函数：更新昆虫百科信息
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取执行上下文和用户信息
  const wxContext = cloud.getWXContext();
  console.log('接收到更新昆虫百科信息请求');
  console.log('云函数调用参数:', JSON.stringify(event));
  console.log('用户openid:', wxContext.OPENID);
  console.log('调用环境:', wxContext.ENV);
  
  const { insectId, encyclopedia, externalId } = event;
  
  // 详细记录接收到的所有参数
  console.log('接收到的昆虫ID(insectId):', insectId);
  console.log('接收到的外部ID(externalId):', externalId);
  console.log('百科信息长度:', encyclopedia ? encyclopedia.length : 0);
  
  // 参数验证
  if (!insectId && !externalId) {
    console.error('参数验证失败: 缺少昆虫ID参数');
    return {
      success: false,
      message: '缺少昆虫ID参数'
    };
  }
  
  if (!encyclopedia) {
    console.warn('百科信息为空，将保存空内容');
  }
  
  try {
    let targetInsectId;
    
    // 优先使用externalId查询
    if (externalId) {
      console.log('使用externalId查询昆虫记录，externalId:', externalId);
      
      // 使用externalId查询对应的昆虫记录
      const insectByExternalId = await db.collection('insects')
        .where({ externalId: externalId })
        .field({ _id: true })
        .get();
      
      console.log('externalId查询结果:', JSON.stringify(insectByExternalId));
      
      if (insectByExternalId.data && insectByExternalId.data.length > 0) {
        targetInsectId = insectByExternalId.data[0]._id;
        console.log('找到对应的数据库ID:', targetInsectId);
      } else {
        console.error('未找到对应externalId的昆虫记录');
        // 尝试查询所有昆虫记录的externalId，用于调试
        const allInsects = await db.collection('insects').limit(100).get();
        console.log('系统中的部分昆虫记录externalId:', 
          allInsects.data.map(insect => ({ 
            id: insect._id, 
            externalId: insect.externalId 
          })));
        
        return {
          success: false,
          message: '未找到对应externalId的昆虫记录'
        };
      }
    } else {
      // 使用insectId（可能是数据库_id）
      console.log('直接使用insectId作为数据库ID:', insectId);
      targetInsectId = insectId;
    }
    
    // 检查昆虫是否存在
    console.log('检查昆虫是否存在，数据库ID:', targetInsectId);
    const insectDoc = await db.collection('insects').doc(targetInsectId).get();
    
    console.log('昆虫查询结果:', JSON.stringify(insectDoc));
    
    if (!insectDoc || !insectDoc.data) {
      console.error('昆虫不存在，数据库ID:', targetInsectId);
      return {
        success: false,
        message: '昆虫不存在'
      };
    }
    
    console.log('昆虫记录存在，准备更新百科信息');
    
    // 更新百科信息
    console.log('开始更新百科信息，数据库ID:', targetInsectId);
    
    // 准备更新数据
    const updateData = {
      encyclopedia: encyclopedia,
      updateTime: db.serverDate()
    };
    console.log('准备更新的数据:', JSON.stringify(updateData));
    
    const updateResult = await db.collection('insects').doc(targetInsectId).update({
      data: updateData
    });
    
    console.log('更新结果:', JSON.stringify(updateResult));
    
    // 验证更新是否成功
    if (updateResult.stats && updateResult.stats.updated === 1) {
      console.log('百科信息更新成功');
    } else {
      console.warn('更新操作已执行，但可能未实际更新任何记录');
    }
    
    // 更新后再次查询，验证数据是否实际保存
    const updatedDoc = await db.collection('insects').doc(targetInsectId).get();
    console.log('更新后验证数据:', {
      encyclopediaLength: updatedDoc.data.encyclopedia ? updatedDoc.data.encyclopedia.length : 0,
      updateTime: updatedDoc.data.updateTime
    });
    
    return {
      success: true,
      message: '百科信息更新成功',
      updatedFields: {
        encyclopediaLength: encyclopedia ? encyclopedia.length : 0,
        updateTime: true
      }
    };
  } catch (error) {
    console.error('更新昆虫百科信息失败:', error);
    console.error('错误详情:', {
      message: error.message,
      errCode: error.errCode,
      stack: error.stack
    });
    
    if (error.errCode === 'ResourceNotFound') {
      return {
        success: false,
        message: '昆虫不存在',
        errorCode: 'ResourceNotFound'
      };
    } else if (error.errCode === 'DATABASE_REQUEST_FAILED') {
      return {
        success: false,
        message: '数据库请求失败',
        errorCode: 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      message: `更新失败，请重试: ${error.message}`,
      errorCode: error.errCode || 'UNKNOWN_ERROR',
      errorDetails: error.message
    };
  }

};