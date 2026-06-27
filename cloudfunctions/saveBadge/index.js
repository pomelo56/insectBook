// 保存勋章配置云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    console.log('saveBadge 云函数开始执行');
    console.log('接收到的参数:', JSON.stringify(event));
    
    const { badge } = event;
    
    // 增强参数验证
    if (!badge) {
      console.log('参数验证失败: badge 对象为空');
      return {
        success: false,
        message: '缺少勋章数据'
      };
    }
    
    if (!badge.name || typeof badge.name !== 'string' || badge.name.trim() === '') {
      console.log('参数验证失败: 勋章名称无效', badge.name);
      return {
        success: false,
        message: '勋章名称不能为空'
      };
    }
    
    if (!badge.requiredCount || typeof badge.requiredCount !== 'number' || badge.requiredCount <= 0) {
      console.log('参数验证失败: 所需数量无效', badge.requiredCount);
      return {
        success: false,
        message: '所需数量必须是大于0的数字'
      };
    }
    
    console.log('参数验证通过，开始保存勋章');
    
    // 获取用户上下文
    const wxContext = cloud.getWXContext();
    console.log('用户上下文:', {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      env: wxContext.ENV
    });
    
    const now = db.serverDate();
    let result;
    
    if (badge.id) {
      // 更新操作
      console.log('执行更新操作，勋章ID:', badge.id);
      
      // 先检查记录是否存在
      try {
        const existingBadge = await db.collection('badges').doc(badge.id).get();
        if (!existingBadge.data) {
          return {
            success: false,
            message: '要更新的勋章不存在'
          };
        }
      } catch (checkError) {
        console.error('检查现有勋章失败:', checkError);
        return {
          success: false,
          message: '检查现有勋章失败: ' + checkError.message
        };
      }
      
      result = await db.collection('badges').doc(badge.id).update({
        data: {
          name: badge.name.trim(),
          level: badge.level ? badge.level.trim() : '',
          requiredCount: parseInt(badge.requiredCount),
          icon: badge.icon || '',
          description: badge.description || '',
          updateTime: now
        }
      });
      console.log('更新操作完成:', result);
    } else {
      // 添加操作
      console.log('执行添加操作');
      
      // 检查是否有重复的勋章名称
      try {
        const duplicateCheck = await db.collection('badges')
          .where({
            name: badge.name.trim()
          })
          .count();
        
        if (duplicateCheck.total > 0) {
          return {
            success: false,
            message: '已存在同名的勋章'
          };
        }
      } catch (duplicateError) {
        console.warn('检查重复勋章名称失败:', duplicateError);
      }
      
      const badgeData = {
        name: badge.name.trim(),
        level: badge.level ? badge.level.trim() : '',
        requiredCount: parseInt(badge.requiredCount),
        icon: badge.icon || '',
        description: badge.description || '',
        createTime: now,
        updateTime: now
      };
      
      console.log('准备添加的勋章数据:', badgeData);
      
      result = await db.collection('badges').add({
        data: badgeData
      });
      console.log('添加操作完成:', result);
    }
    
    // 暂时注释掉操作日志记录，避免集合不存在的错误
    // // 尝试记录操作日志（如果失败不影响主流程）
    // try {
    //   await db.collection('admin_operations').add({
    //     data: {
    //       operator: wxContext.OPENID || 'unknown',
    //       action: badge.id ? 'update_badge' : 'add_badge',
    //       badgeId: badge.id || result._id,
    //       badgeName: badge.name.trim(),
    //       timestamp: now
    //     }
    //   });
    //   console.log('操作日志记录成功');
    // } catch (logError) {
    //   console.warn('记录操作日志失败，但不影响主流程:', logError);
    // }
    
    const response = {
      success: true,
      message: badge.id ? '勋章更新成功' : '勋章添加成功',
      badgeId: badge.id || result._id,
      data: {
        name: badge.name.trim(),
        requiredCount: parseInt(badge.requiredCount),
        icon: badge.icon || '',
        description: badge.description || ''
      }
    };
    
    console.log('云函数执行成功，返回结果:', response);
    return response;
    
  } catch (error) {
    console.error('保存勋章失败，完整错误信息:', error);
    console.error('错误堆栈:', error.stack);
    
    // 提供更详细的错误信息
    let errorMessage = '保存失败';
    if (error.code) {
      errorMessage += ` (错误码: ${error.code})`;
    }
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR'
    };
  }
};