// 昆虫发现记录云函数 - 重构版
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 昆虫名称标准化映射表
const INSECT_NAME_MAP = {
  '蝴蝶': ['胡蝶', '蝶', '蛱蝶', '凤蝶', '粉蝶'],
  '蜜蜂': ['蜂', '蜜糖蜂', '小蜜蜂'],
  '蜻蜓': ['蜻蛉', '豆娘'],
  '苍蝇': ['蝇', '家蝇', '果蝇'],
  '蚊子': ['蚊', '疟蚊', '库蚊'],
  '蟑螂': ['蜚蠊', '小强', '甲由'],
  '蚂蚁': ['蚁', '白蚁'],
  '蚂蚱': ['蝗虫', '蚱蜢'],
  '蝉': ['知了', '蝉蜕'],
  '甲虫': ['金龟子', '天牛', '独角仙'],
  '蜘蛛': ['蛛', '圆蛛', '跳蛛'],
  '蟋蟀': ['蛐蛐', '促织'],
  '螳螂': ['刀螂', '祷告虫'],
  '萤火虫': ['流萤', '夜光虫'],
  '毛毛虫': ['毛虫', '刺毛虫'],
  '虱子': ['虱', '体虱'],
  '跳蚤': ['蚤'],
  '蚜虫': ['腻虫', '蜜虫'],
  '飞蛾': ['蛾', '夜蛾'],
  '竹节虫': ['虫修'],
  '椿象': ['臭虫', '放屁虫'],
  '书虱': ['书虫']
};

// 预设昆虫图片URL映射表
const PRESET_IMAGE_URLS = {
  '蝴蝶': 'https://example.com/butterfly.jpg',
  '蜜蜂': 'https://example.com/bee.jpg',
  '蜻蜓': 'https://example.com/dragonfly.jpg',
  '苍蝇': 'https://example.com/fly.jpg',
  '蚊子': 'https://example.com/mosquito.jpg',
  '蟑螂': 'https://example.com/cockroach.jpg',
  '蚂蚁': 'https://example.com/ant.jpg',
  '蚂蚱': 'https://example.com/grasshopper.jpg',
  '蝉': 'https://example.com/cicada.jpg',
  '甲虫': 'https://example.com/beetle.jpg',
  '蜘蛛': 'https://example.com/spider.jpg',
  '蟋蟀': 'https://example.com/cricket.jpg',
  '螳螂': 'https://example.com/mantis.jpg',
  '萤火虫': 'https://example.com/firefly.jpg',
  '毛毛虫': 'https://example.com/caterpillar.jpg',
  '虱子': 'https://example.com/louse.jpg',
  '跳蚤': 'https://example.com/flea.jpg',
  '蚜虫': 'https://example.com/aphid.jpg',
  '飞蛾': 'https://example.com/moth.jpg',
  '竹节虫': 'https://example.com/stick_insect.jpg',
  '椿象': 'https://example.com/stink_bug.jpg',
  '书虱': 'https://example.com/book_louse.jpg'
};

/**
 * 获取标准化昆虫名称
 * @param {string} name - 原始昆虫名称
 * @returns {string} 标准化后的昆虫名称
 */
function getNormalizedInsectName(name) {
  if (!name) return '';
  
  const lowerName = name.toLowerCase();
  for (const [standardName, aliases] of Object.entries(INSECT_NAME_MAP)) {
    if (lowerName === standardName.toLowerCase() || 
        aliases.some(alias => lowerName.includes(alias.toLowerCase()))) {
      return standardName;
    }
  }
  return name;
}

/**
 * 生成统一昆虫ID
 * @param {string} name - 昆虫名称
 * @returns {string} 生成的昆虫ID
 */
function generateInsectId(name) {
  if (!name) return '';
  return `insect_${name.replace(/\s+/g, '_').toLowerCase()}`;
}

/**
 * 获取预设图片URL
 * @param {string} name - 昆虫名称
 * @returns {string} 图片URL
 */
function getPresetImageUrl(name) {
  return PRESET_IMAGE_URLS[name] || 'https://example.com/default_insect.jpg';
}

/**
 * 检查并添加昆虫到insects表（如果不存在）
 * @param {string} insectId - 昆虫ID
 * @param {string} normalizedName - 标准化昆虫名称
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<object>} 昆虫信息对象
 */
async function checkAndAddInsect(insectId, normalizedName, imageUrl) {
  try {
    // 检查昆虫是否已存在
    const insectResult = await db.collection('insects').doc(insectId).get();
    return insectResult.data;
  } catch (error) {
    // 如果不存在，则创建新昆虫记录
    if (error.errCode === -1) {
      console.log('准备添加新昆虫到insects表');
      
      try {
        const insectData = {
          _id: insectId,
          name: normalizedName,
          normalizedName,
          imageUrl: imageUrl || getPresetImageUrl(normalizedName),
          description: '',
          classification: {},
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        };
        
        // 添加新昆虫记录
        await db.collection('insects').doc(insectId).set({
          data: insectData
        });
        
        console.log('新昆虫添加成功:', insectId);
        return insectData;
      } catch (addError) {
        console.error('添加新昆虫失败:', addError);
        // 抛出错误，确保调用者知道操作失败
        throw new Error(`添加昆虫失败: ${addError.message}`);
      }
    } else {
      // 其他错误情况
      console.error('检查昆虫存在性时出错:', error);
      throw error;
    }
  }
}

/**
 * 更新昆虫信息
 * @param {string} insectId - 昆虫ID
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<void>}
 */
async function updateInsectInfo(insectId, imageUrl) {
  try {
    // 只更新必要的字段
    const updateData = {
      updateTime: db.serverDate()
    };
    
    // 如果图片URL存在且不为空，则更新图片URL
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    
    await db.collection('insects').doc(insectId).update({
      data: updateData
    });
    
    console.log('昆虫信息更新成功:', insectId);
  } catch (error) {
    console.error('更新昆虫信息失败:', error);
    // 不抛出错误，因为这不是核心功能失败
  }
}

/**
 * 查询用户昆虫记录
 * @param {string} openid - 用户openid
 * @param {string} insectId - 昆虫ID
 * @returns {Promise<object|null>} 用户昆虫记录或null
 */
async function getUserInsectRecord(openid, insectId) {
  try {
    const result = await db.collection('user_insects')
      .where({
        _openid: openid,
        insectId: insectId
      })
      .orderBy('lastFoundTime', 'desc')
      .get();
    
    return result.data && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    console.error('查询用户昆虫记录失败:', error);
    return null;
  }
}

/**
 * 创建新的用户昆虫记录
 * @param {string} openid - 用户openid
 * @param {object} recordData - 记录数据
 * @returns {Promise<object>} 创建的记录
 */
async function createUserInsectRecord(openid, recordData) {
  try {
    const newRecordData = {
      _openid: openid,
      ...recordData,
      foundCount: 1, // 新记录的发现次数始终为1
      createTime: db.serverDate(),
      lastFoundTime: db.serverDate()
    };
    
    console.log('新记录数据:', JSON.stringify(newRecordData));
    
    const result = await db.collection('user_insects').add({
      data: newRecordData
    });
    
    console.log('新用户昆虫记录创建成功');
    return { ...newRecordData, _id: result._id };
  } catch (error) {
    console.error('创建用户昆虫记录失败:', error);
    throw new Error(`创建记录失败: ${error.message}`);
  }
}

/**
 * 更新用户昆虫记录
 * @param {string} recordId - 记录ID
 * @param {object} updateData - 更新数据
 * @returns {Promise<void>}
 */
async function updateUserInsectRecord(recordId, updateData) {
  try {
    // 确保不会意外更新foundCount和lastFoundTime
    const safeUpdateData = { ...updateData };
    delete safeUpdateData.foundCount;
    delete safeUpdateData.lastFoundTime;
    
    await db.collection('user_insects').doc(recordId).update({
      data: safeUpdateData
    });
    
    console.log('用户昆虫记录更新成功:', recordId);
  } catch (error) {
    console.error('更新用户昆虫记录失败:', error);
    throw new Error(`更新记录失败: ${error.message}`);
  }
}

/**
 * 删除用户昆虫记录
 * @param {string} openid - 用户openid
 * @param {string} insectId - 昆虫ID
 * @returns {Promise<void>}
 */
async function deleteUserInsectRecord(openid, insectId) {
  try {
    // 先查询记录
    const userRecord = await getUserInsectRecord(openid, insectId);
    
    if (userRecord) {
      // 删除记录
      await db.collection('user_insects').doc(userRecord._id).remove();
      console.log('用户昆虫记录删除成功:', userRecord._id);
    } else {
      console.log('没有找到要删除的用户昆虫记录');
    }
  } catch (error) {
    console.error('删除用户昆虫记录失败:', error);
    throw new Error(`删除记录失败: ${error.message}`);
  }
}

/**
 * 获取用户发现统计信息
 * @param {string} openid - 用户openid
 * @returns {Promise<object>} 统计信息
 */
async function getUserStats(openid) {
  try {
    const totalFoundResult = await db.collection('user_insects').where({ _openid: openid }).count();
    const totalInsectsResult = await db.collection('insects').count();
    
    return {
      totalFound: totalFoundResult.total,
      totalInsects: totalInsectsResult.total
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    // 返回默认值
    return { totalFound: 0, totalInsects: 0 };
  }
}

/**
 * 处理添加/更新昆虫发现记录
 * @param {object} event - 云函数事件对象
 * @param {object} context - 云函数上下文对象
 * @returns {Promise<object>} 处理结果
 */
async function handleUpdateRecord(event, context) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  // 1. 提取和验证参数
  const { insectId, name, imageUrl, notes, location, isNewDiscovery = false, shouldIncrementCount = false, currentFoundCount } = event;
  
  if (!insectId || !name) {
    throw new Error('缺少必要参数');
  }
  
  // 2. 标准化昆虫名称
  const normalizedName = getNormalizedInsectName(name);
  
  // 3. 处理图片URL
  const finalImageUrl = imageUrl || getPresetImageUrl(normalizedName);
  
  // 4. 检查并添加昆虫到insects表
  const insectData = await checkAndAddInsect(insectId, normalizedName, finalImageUrl);
  
  // 5. 查询用户昆虫记录
  const userInsectRecord = await getUserInsectRecord(openid, insectId);
  const isNewRecord = !userInsectRecord;
  
  // 6. 准备记录数据
  const recordData = {
    insectId,
    name,
    normalizedName,
    imageUrl: finalImageUrl,
    notes,
    location: location || {
      latitude: 0,
      longitude: 0,
      address: '位置未获取'
    },
    updateTime: db.serverDate()
  };
  
  // 7. 根据记录是否存在和操作类型进行处理
  if (isNewRecord) {
    // 创建新记录
    await createUserInsectRecord(openid, recordData);
  } else {
    // 更新现有记录
    await updateUserInsectRecord(userInsectRecord._id, recordData);
  }
  
  // 8. 获取统计信息
  const stats = await getUserStats(openid);
  
  // 9. 确定返回的发现次数
  let finalFoundCount = 0;
  
  if (isNewRecord) {
    // 新创建的记录，发现次数为1
    finalFoundCount = 1;
  } else {
    // 编辑模式下严格使用原始的发现次数
    finalFoundCount = userInsectRecord.foundCount || 0;
    
    // 最终安全检查：确保在编辑模式下返回的发现次数严格等于前端传递的值
    if (!shouldIncrementCount && currentFoundCount !== undefined) {
      finalFoundCount = currentFoundCount;
    }
  }
  
  // 10. 返回结果
  return {
    success: true,
    message: '发现记录已更新',
    isNewRecord,
    foundCount: finalFoundCount,
    data: {
      insectId,
      name: normalizedName,
      totalFound: stats.totalFound,
      totalInsects: stats.totalInsects,
      insectInfo: insectData,
      debugInfo: {
        isNewDiscovery,
        shouldIncrementCount,
        updatedAt: new Date().toISOString()
      }
    }
  };
}

/**
 * 主函数
 * @param {object} event - 云函数事件对象
 * @param {object} context - 云函数上下文对象
 * @returns {Promise<object>} 处理结果
 */
exports.main = async (event, context) => {
  try {
    console.log('===== markFound云函数开始 =====');
    console.log('事件参数:', JSON.stringify(event));
    
    // 根据action参数决定处理逻辑
    const { action = 'update' } = event;
    
    let result;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    switch (action) {
      case 'delete':
        // 处理删除操作
        const { insectId: deleteInsectId } = event;
        if (!deleteInsectId) {
          throw new Error('缺少昆虫ID');
        }
        
        await deleteUserInsectRecord(openid, deleteInsectId);
        
        // 获取最新统计信息
        const deleteStats = await getUserStats(openid);
        
        result = {
          success: true,
          message: '记录已删除',
          data: {
            totalFound: deleteStats.totalFound,
            totalInsects: deleteStats.totalInsects
          }
        };
        break;
        
      case 'update':
      default:
        // 处理添加/更新操作
        result = await handleUpdateRecord(event, context);
        break;
    }
    
    console.log('云函数返回数据:', JSON.stringify(result));
    console.log('===== markFound云函数完成 =====');
    
    return result;
  } catch (error) {
    console.error('保存昆虫记录失败:', error);
    console.log('===== markFound云函数异常结束 =====');
    
    return {
      success: false,
      message: '保存失败',
      error: error.message,
      debug: {
        originalError: JSON.stringify(error),
        processedAt: new Date().toISOString()
      }
    };
  }
};