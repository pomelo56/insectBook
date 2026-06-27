// 昆虫发现记录云函数 - 支持保存、更新和删除操作
const cloud = require('wx-server-sdk');
// 最简化初始化，避免任何文件系统操作
cloud.init({});
const db = cloud.database();
const _ = db.command;

/**
 * 云函数：标记昆虫发现记录
 * 功能：保存、更新或删除用户的昆虫发现记录
 */
exports.main = async (event, context) => {
  try {
    // 获取用户上下文
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    // 获取操作类型和参数
    const { action = 'save', name, userImageUrl, baikeInfo, insectId } = event;
    
    // 删除操作处理
    if (action === 'delete') {
      // 删除操作只需要验证insectId
      if (!insectId || typeof insectId !== 'string' || insectId.trim() === '') {
        return {
          success: false,
          message: '昆虫ID不能为空'
        };
      }
      
      // 执行删除操作
      const deleteResult = await db.collection('user_insects')
        .where({
          _openid: openid,
          insectId: insectId.trim()
        })
        .remove();
      
      if (deleteResult.deleted === 0) {
        return {
          success: false,
          message: '未找到该昆虫记录'
        };
      }
      
      // 更新用户统计
      try {
        const userStats = await db.collection('user_stats').where({ _id: openid }).get();
        if (userStats.data.length > 0) {
          await db.collection('user_stats').doc(openid).update({
            data: {
              totalFoundCount: db.command.inc(-1),
              updatedAt: db.serverDate()
            }
          });
        }
      } catch (e) {
        // 统计更新失败不影响主流程
        console.warn('更新统计失败:', e);
      }
      
      return {
        success: true,
        message: '删除成功',
        data: {
          insectId: insectId.trim()
        },
        userInfo: {
          openid: openid
        }
      };
    }
    
    // 保存/更新操作 - 需要验证name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return {
        success: false,
        message: '昆虫名称不能为空'
      };
    }
    
    // 简化的昆虫ID生成
    const generatedInsectId = name.trim().toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const finalInsectId = insectId || generatedInsectId;
    
    // 查询是否已存在该昆虫记录
    const existingRecord = await db.collection('user_insects')
      .where({
        _openid: openid,
        insectId: finalInsectId
      })
      .limit(1)
      .get();
    
    // 优先使用前端传递的拍摄时间，如果没有则使用服务器当前时间
    const clientTimestamp = event.clientTimestamp;
    console.log('接收到的clientTimestamp:', clientTimestamp, '类型:', typeof clientTimestamp);
    
    const discoveryTime = clientTimestamp ? 
      new Date(clientTimestamp) : 
      db.serverDate();
    const currentTime = db.serverDate();
    
    // 详细的时间日志
    console.log('使用的发现时间:', discoveryTime);
    console.log('时间来源:', clientTimestamp ? '前端传递的拍摄时间' : '服务器时间');
    if (clientTimestamp) {
      console.log('格式化的拍摄时间:', discoveryTime.toLocaleString('zh-CN'));
      console.log('前端传递的原始时间戳:', clientTimestamp);
    }
    
    if (existingRecord.data.length > 0) {
      // 更新现有记录
      const record = existingRecord.data[0];
      const currentFoundCount = record.foundCount || 0;
      
      // 创建新的发现记录
      const newFoundRecord = {
        _id: `record_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        time: discoveryTime,
        userImageUrl: userImageUrl,
        location: event.location || '',
        description: event.description || '',
        baikeInfo: baikeInfo
      };
      
      // 更新数据，包括将新记录添加到foundRecords数组
      const updateData = {
        name: name,
        updatedAt: currentTime,
        foundCount: currentFoundCount + 1,
        lastFoundTime: discoveryTime,
        // 将新记录添加到数组开头
        foundRecords: db.command.push(newFoundRecord)
      };
      
      // 只在提供图片时更新主记录的图片URL
      if (userImageUrl) {
        updateData.userImageUrl = userImageUrl;
      }
      
      // 只在提供百科信息时更新
      if (baikeInfo && typeof baikeInfo === 'object') {
        updateData.baikeInfo = baikeInfo;
      }
      
      await db.collection('user_insects').doc(record._id).update({
        data: updateData
      });
      
      console.log('更新记录并添加新发现记录:', newFoundRecord);
      
      // 异步触发数据同步，确保主流程不受影响
      try {
        console.log('异步触发昆虫数据同步...');
        // 使用cloud.callFunction异步调用syncInsectData函数
        // 不等待其完成，避免影响主函数性能
        cloud.callFunction({
          name: 'syncInsectData'
        }).then(result => {
          console.log('昆虫数据同步成功:', result);
        }).catch(err => {
          console.error('昆虫数据同步失败:', err);
        });
      } catch (syncError) {
        // 同步失败不影响主流程
        console.warn('触发数据同步失败:', syncError);
      }
    } else {
      // 创建第一个发现记录
      const firstFoundRecord = {
        _id: `record_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        time: discoveryTime,
        userImageUrl: userImageUrl,
        location: event.location || '',
        description: event.description || '',
        baikeInfo: baikeInfo
      };
      
      // 创建新记录，包含发现记录数组
      const newRecord = {
        _openid: openid,
        name: name,
        insectId: finalInsectId,
        userImageUrl: userImageUrl || '',
        baikeInfo: baikeInfo || {},
        foundCount: 1,
        foundRecords: [firstFoundRecord],
        createdAt: currentTime,
        updatedAt: currentTime,
        lastFoundTime: discoveryTime
      };
      
      await db.collection('user_insects').add({
        data: newRecord
      });
      
      console.log('创建新记录并添加初始发现记录:', firstFoundRecord);
      
      // 更新用户统计
      try {
        await db.collection('user_stats').doc(openid).set({
          data: {
            totalFoundCount: db.command.inc(1),
            updatedAt: currentTime
          },
          merge: true
        });
      } catch (e) {
        // 统计更新失败不影响主流程
        console.warn('更新统计失败:', e);
      }
      
      // 异步触发数据同步，确保主流程不受影响
      try {
        console.log('异步触发昆虫数据同步...');
        // 使用cloud.callFunction异步调用syncInsectData函数
        // 不等待其完成，避免影响主函数性能
        cloud.callFunction({
          name: 'syncInsectData'
        }).then(result => {
          console.log('昆虫数据同步成功:', result);
        }).catch(err => {
          console.error('昆虫数据同步失败:', err);
        });
      } catch (syncError) {
        // 同步失败不影响主流程
        console.warn('触发数据同步失败:', syncError);
      }
    }
    
    // 获取总数
    const totalFound = await db.collection('user_insects').where({ _openid: openid }).count();
    
    return {
      success: true,
      message: '保存成功',
      data: {
        name: name,
        insectId: finalInsectId
      },
      userInfo: {
        openid: openid,
        totalFound: totalFound.total
      }
    };
    
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      message: '保存失败，请重试',
      error: error.message
    };
  }
};