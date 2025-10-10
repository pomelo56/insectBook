// cloudfunctions/markFound/index.js
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 昆虫名称标准化映射（解决同种昆虫不同名称的问题）
const INSECT_NAME_MAP = {
  '螳螂': '螳螂',
  '眼斑螳螂': '眼斑螳螂',
  '枯叶螳螂': '枯叶螳螂',
  '大刀螳螂': '大刀螳螂',
  '中华螳螂': '中华螳螂',
  '地鳖': '地鳖',
  '蝴蝶': '蝴蝶',
  '蜜蜂': '蜜蜂',
  '蚂蚁': '蚂蚁',
  '胡蜂': '胡蜂',
  '熊蜂': '熊蜂',
  '蛾': '蛾',
  '蜻蜓': '蜻蜓',
  '豆娘': '豆娘',
  '蟋蟀': '蟋蟀',
  '蝗虫': '蝗虫',
  '螽斯': '螽斯',
  '甲虫': '甲虫',
  '瓢虫': '瓢虫',
  '天牛': '天牛',
  '金龟子': '金龟子',
  '蝉': '蝉',
  '蚱蝉': '蚱蝉',
  '蟪蛄': '蟪蛄',
  '蟑螂': '蟑螂',
  '蠼螋': '蠼螋',
  '蜈蚣': '蜈蚣'
};

// 标准化昆虫名称
function normalizeInsectName(name) {
  return INSECT_NAME_MAP[name] || name;
}

// 生成统一的昆虫ID
function generateInsectId(name) {
  const normalizedName = normalizeInsectName(name);
  // 使用标准化名称生成ID，避免同种昆虫不同ID
  return normalizedName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('===== markFound云函数开始 =====');
  console.log('接收到的event参数:', JSON.stringify(event));
  
  const { name, baikeInfo, notes, notesList, isNewDiscovery, userImageUrl, action, insectId: eventInsectId } = event;
  
  // 处理删除操作
  if (action === 'delete') {
    console.log('执行删除昆虫记录操作');
    
    try {
      // 获取用户openid
      const wxContext = cloud.getWXContext();
      const openid = wxContext.OPENID;
      
      // 标准化名称和生成统一ID（如果没有传入insectId）
      const normalizedName = name ? normalizeInsectName(name) : '';
      const insectId = eventInsectId || (name ? generateInsectId(normalizedName) : '');
      
      if (!insectId) {
        console.log('错误：无法确定要删除的昆虫ID');
        return {
          success: false,
          message: '删除失败，无法确定昆虫ID'
        };
      }
      
      console.log('准备删除的昆虫信息:', {
        name: name,
        normalizedName: normalizedName,
        insectId: insectId,
        openid: openid
      });
      
      // 查询用户昆虫记录
      const userInsectRecord = await db.collection('user_insects')
        .where({
          _openid: openid,
          insectId: insectId
        })
        .get();
      
      if (userInsectRecord.data.length === 0) {
        console.log('未找到用户昆虫记录');
        return {
          success: false,
          message: '未找到该昆虫记录'
        };
      }
      
      // 执行删除操作
      const recordId = userInsectRecord.data[0]._id;
      await db.collection('user_insects').doc(recordId).remove();
      
      console.log('用户昆虫记录删除成功，记录ID:', recordId);
      
      // 返回删除成功结果
      return {
        success: true,
        message: '昆虫记录已删除',
        data: {
          insectId: insectId,
          recordId: recordId
        }
      };
    } catch (error) {
      console.error('删除昆虫记录失败:', error);
      return {
        success: false,
        message: '删除失败',
        error: error.message
      };
    }
  }
  
  // 处理常规的保存/更新操作
  if (!name || typeof name !== 'string') {
    console.log('错误：昆虫名称不能为空');
    return {
      success: false,
      message: '昆虫名称不能为空'
    };
  }
  
  // 默认为编辑模式，不是新发现
  // 重点修复：使用更严格的判断条件，确保只有明确传入true时才增加发现次数
  const shouldIncrementCount = isNewDiscovery !== undefined && isNewDiscovery === true;
  console.log('isNewDiscovery参数:', isNewDiscovery, '类型:', typeof isNewDiscovery);
  console.log('shouldIncrementCount计算结果:', shouldIncrementCount);
  // 增加更详细的日志，记录isNewDiscovery的具体值和类型
  console.log('参数验证详情:', {
    isNewDiscoveryValue: isNewDiscovery,
    isNewDiscoveryType: typeof isNewDiscovery,
    shouldIncrementCount: shouldIncrementCount
  });
  
  // 提前获取和记录前端传递的当前发现次数
  const clientReportedCount = event.currentFoundCount;
  console.log('函数开始：接收到前端传递的当前发现次数:', clientReportedCount);
  
  try {
      // 获取用户openid
      const wxContext = cloud.getWXContext();
      const openid = wxContext.OPENID;
      
      // 标准化名称和生成统一ID
      const normalizedName = normalizeInsectName(name);
      const insectId = generateInsectId(normalizedName);
      
      // 定义常见昆虫类别关键词 - 后端验证
      const insectKeywords = ['昆虫', '蝴蝶', '蜻蜓', '蚂蚁', '蜜蜂', '螳螂', '甲虫', '蝉', '蝗虫', '蜘蛛', '蟋蟀', '苍蝇', '蚊子', '蟑螂', '瓢虫', '天牛', '金龟子', '胡蜂', '熊蜂', '螽斯', '锹甲', '锹形虫', '幽灵螳螂'];
      const isInsect = insectKeywords.includes(name) || 
                     (baikeInfo && baikeInfo.classname && insectKeywords.some(keyword => baikeInfo.classname.includes(keyword)));
      
      console.log('保存昆虫记录:', { 
        originalName: name,
        normalizedName: normalizedName,
        insectId: insectId,
        openid: openid,
        isInsectCheck: isInsect
      });
      
      console.log('当前环境ID:', cloud.getWXContext().ENV);
      console.log('生成的昆虫ID长度:', insectId.length, 'ID内容:', insectId);

    // 检查昆虫是否已存在于昆虫库
    console.log('开始检查昆虫是否已存在于昆虫库，ID:', insectId);
    let insectExists = false;
    let insectData = null;
    try {
      console.log('执行insects表查询，collection:', db.collection('insects').name, 'doc:', insectId);
      const insectDoc = await db.collection('insects').doc(insectId).get();
      insectExists = !!insectDoc.data;
      insectData = insectDoc.data;
      console.log('昆虫查询结果:', {exists: insectExists, data: insectExists ? '存在' : '不存在'});
    } catch (err) {
      console.log('昆虫查询异常:', err.message);
      insectExists = false;
    }

    // 获取图片URL的统一函数
    function getImageUrl(normalizedName) {
      let imageUrl = baikeInfo && baikeInfo.image_url ? baikeInfo.image_url : '';
      
      // 昆虫图片URL集合 - 确保有图片可用
      const insectImageUrls = {
        '眼斑螳螂': 'https://t7.baidu.com/it/u=3061347029,3963666737&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
        '步甲幼虫': 'https://t7.baidu.com/it/u=110131899,2058617435&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
        '地鳖': 'https://t7.baidu.com/it/u=4221003161,3077827695&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=300',
        '蝴蝶': 'https://t7.baidu.com/it/u=1935592311,2578343870&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=313',
        '蜜蜂': 'https://t7.baidu.com/it/u=1464345686,3372357833&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        '蚂蚁': 'https://t7.baidu.com/it/u=248068639,3395915469&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        '蜻蜓': 'https://t7.baidu.com/it/u=1029684111,3681641525&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        '变色树蜥': 'https://t7.baidu.com/it/u=2510668569,1048315846&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
        '牡丹鹦鹉': 'https://t7.baidu.com/it/u=3106284192,2244210758&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333'
      };
      
      // 优先使用预设的图片URL
      if (!imageUrl && insectImageUrls[normalizedName]) {
        imageUrl = insectImageUrls[normalizedName];
        console.log('使用预设的昆虫图片:', imageUrl);
      }
      
      // 如果没有预设图片，使用默认图片
      if (!imageUrl) {
        console.log('使用默认昆虫图片');
        imageUrl = 'https://t7.baidu.com/it/u=339636939,3147963878&fm=193&f=GIF';
      }
      
      return imageUrl;
    }
    
    if (!insectExists) {
      // 添加新昆虫到昆虫库
      console.log('准备添加新昆虫到insects表');
      const imageUrl = getImageUrl(normalizedName);
      
      insectData = {
        _id: insectId,
        name: normalizedName,
        category: baikeInfo && baikeInfo.classname ? baikeInfo.classname : '未知',
        habitat: baikeInfo && baikeInfo.place ? baikeInfo.place : '未知',
        food: baikeInfo && baikeInfo.food ? baikeInfo.food : '未知',
        description: baikeInfo && baikeInfo.description ? baikeInfo.description : '',
        imageUrl: imageUrl,
        baikeUrl: baikeInfo && baikeInfo.baike_url ? baikeInfo.baike_url : '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };
      
      console.log('添加新昆虫到库，数据:', {
        id: insectData._id,
        name: insectData.name,
        imageUrl: insectData.imageUrl,
        category: insectData.category
      });
      
      try {
        console.log('执行insects表set操作，collection:', db.collection('insects').name, 'doc:', insectId);
        // 创建一个不包含_id的新对象
        const dataWithoutId = { ...insectData };
        delete dataWithoutId._id;
        
        const result = await db.collection('insects').doc(insectId).set({
          data: dataWithoutId
        });
        console.log('昆虫添加到库成功，结果:', result);
      } catch (addError) {
        console.error('添加昆虫到库失败，错误详情:', {
          message: addError.message,
          code: addError.code,
          stack: addError.stack
        });
        // 重要修复：如果添加昆虫到库失败，应抛出错误中断执行，而不是继续
        throw new Error('添加昆虫信息失败: ' + addError.message);
      }
    } else {
      // 更新已有昆虫信息 - 包括图片（如果当前图片为空）
      const updateData = {
        updateTime: db.serverDate()
      };
      
      // 如果现有昆虫没有图片，更新图片
      if (!insectData.imageUrl) {
        const imageUrl = getImageUrl(normalizedName);
        updateData.imageUrl = imageUrl;
        console.log('更新昆虫图片:', imageUrl);
      }
      
      try {
        await db.collection('insects').doc(insectId).update({
          data: updateData
        });
      } catch (updateError) {
        console.error('更新昆虫信息失败:', updateError);
      }
    }
    
    // 检查用户是否已经发现过这种昆虫（使用统一ID）
    const userInsectRecord = await db.collection('user_insects')
      .where({
        _openid: openid,
        insectId: insectId
      })
      .get();
    
    const now = db.serverDate();
    console.log('查询到用户昆虫记录:', userInsectRecord.data.length > 0 ? '存在' : '不存在');
    
    if (userInsectRecord.data.length > 0) {
      // 如果已存在
      const recordId = userInsectRecord.data[0]._id;
      const currentCount = userInsectRecord.data[0].foundCount || 0;
      const originalLastFoundTime = userInsectRecord.data[0].lastFoundTime;
      
      console.log('用户昆虫记录详情:', {
        recordId: recordId,
        currentCount: currentCount,
        originalLastFoundTime: originalLastFoundTime,
        existingNotes: userInsectRecord.data[0].notes
      });
      
      // 创建更新数据对象
      const updateData = {
        // 如果提供了笔记数据，更新笔记
        ...(notes && { notes }),
        ...(notesList && { notesList }),
        // 如果提供了用户上传的图片URL，更新图片
        ...(userImageUrl && { userImageUrl })
      };

      // 关键修复：当应该增加计数时，明确设置发现次数为1
      if (shouldIncrementCount) {
        updateData.foundCount = 1;
        console.log('更新数据包含发现次数:', updateData.foundCount);
      }
      
      // 重要修复：只有在新发现模式下才增加发现次数和更新lastFoundTime
      console.log('执行更新前 - shouldIncrementCount:', shouldIncrementCount);
      console.log('执行更新前 - isNewDiscovery参数值:', event.isNewDiscovery, '类型:', typeof event.isNewDiscovery);
      console.log('执行更新前 - 当前发现次数:', currentCount);
      
      // 直接使用shouldIncrementCount变量进行判断
      // 这个变量已经包含了isNewDiscovery === true的严格检查
      console.log('shouldIncrementCount值:', shouldIncrementCount);
      
      if (shouldIncrementCount) {
        // 重要修复：对于明确标记为新发现的昆虫，即使记录存在也应该重置发现次数为1
        // 这确保了用户删除后重新添加的昆虫会被视为新发现
        updateData.foundCount = 1;
        updateData.lastFoundTime = now;
        console.log('新发现模式：重置发现次数为1（适用于重新添加的昆虫）');
        console.log('新发现模式：更新lastFoundTime为当前时间');
      } else {
        // 重点修复：编辑模式下严格保留原始的发现次数，并且不更新lastFoundTime
        console.log('编辑模式：保持发现次数不变，当前次数:', currentCount);
        console.log('编辑模式：完全不更新lastFoundTime，避免首页排序变化');
        
        // 添加多层、冗余的保护措施，确保在任何情况下编辑模式都不会修改发现次数
        // 措施1: 明确设置foundCount为原始值
        updateData.foundCount = currentCount;
        console.log('编辑模式：明确设置foundCount为原始值:', currentCount);
        
        // 措施2: 强制删除updateData中的foundCount字段，确保它不会被传递给数据库
        // 这是最关键的保护措施，确保无论前面做了什么，数据库更新操作都不会包含foundCount字段
        delete updateData.foundCount;
        console.log('编辑模式关键保护：强制移除updateData中的foundCount字段，确保绝对不会被更新');
        
        // 措施3: 确保不更新任何可能影响排序的字段
        delete updateData.lastFoundTime;
        delete updateData.updateTime;
        
        // 添加更详细的日志记录，以便追踪问题
        console.log('编辑模式保护措施：强制锁定发现次数，防止意外增加');
        console.log('编辑模式保护措施：完全不更新lastFoundTime，确保首页排序不变');
        console.log('编辑模式原始数据:', {
          originalFoundCount: currentCount,
          originalLastFoundTime: originalLastFoundTime
        });
        console.log('编辑模式最终updateData内容:', JSON.stringify(updateData));
        // 明确检查updateData中是否还存在foundCount字段
        console.log('编辑模式检查：updateData中是否包含foundCount字段:', 'foundCount' in updateData);
      }
      
      console.log('准备更新的数据:', JSON.stringify(updateData));
      
      // 更新用户昆虫记录
      console.log('准备执行更新操作，数据:', JSON.stringify(updateData));
      await db.collection('user_insects').doc(recordId).update({
        data: updateData
      });
      
      console.log('用户昆虫记录更新成功');
      
      // 查询更新后的记录以确认
      const updatedRecord = await db.collection('user_insects').doc(recordId).get();
      console.log('更新后记录确认:', {
        foundCount: updatedRecord.data.foundCount,
        lastFoundTime: updatedRecord.data.lastFoundTime,
        notes: updatedRecord.data.notes
      });
    } else {
        // 如果不存在，创建新记录
        // 新记录总是作为新发现处理
        console.log('创建新的用户昆虫记录');
        const newRecordData = {
          _openid: openid, // 显式设置_openid字段，确保记录正确关联到用户
          insectId: insectId,
          name: normalizedName,
          foundCount: 1,
          firstFoundTime: now,
          lastFoundTime: now,
          // 保存用户上传的图片URL
          ...(userImageUrl && { userImageUrl }),
          // 如果提供了笔记数据，保存笔记
          ...(notes && { notes }),
          ...(notesList && { notesList })
        };
      
      console.log('新记录数据:', JSON.stringify(newRecordData));
      
      await db.collection('user_insects').add({
        data: newRecordData
      });
      
      console.log('新用户昆虫记录创建成功');
    }
    
    // 查询用户最新的发现统计信息
    const totalFound = await db.collection('user_insects').where({ _openid: openid }).count();
    const totalInsects = await db.collection('insects').count();
    
    // 确定返回的发现次数
    let finalFoundCount = 0;
    
    // 获取前端传递的当前发现次数，用于验证
    const clientReportedCount = event.currentFoundCount;
    console.log('前端传递的当前发现次数:', clientReportedCount);
    
    // 关键修复：根据是否是新创建的记录来决定返回的发现次数
    // 如果是新创建的记录，直接返回1
    if (userInsectRecord.data.length === 0) {
      // 新创建的记录，发现次数应为1
      finalFoundCount = 1;
      console.log('新创建记录：返回发现次数1');
    } else if (userInsectRecord.data.length > 0) {
      // 已有记录的情况下
      if (!shouldIncrementCount) {
        // 重点修复：编辑模式下严格使用原始的发现次数，确保不会被意外增加
        // 注意：这里不查询最新值，而是直接使用传入云函数时查询到的原始值
        console.log('编辑模式：开始确定返回的发现次数');
        console.log('编辑模式：userInsectRecord数据完整性检查:', userInsectRecord && userInsectRecord.data && userInsectRecord.data.length > 0);
        console.log('编辑模式：userInsectRecord数据长度:', userInsectRecord.data.length);
        console.log('编辑模式：原始数据详情:', JSON.stringify(userInsectRecord.data[0]));
        
        // 增加额外的安全检查，确保获取到正确的记录
        if (userInsectRecord.data && userInsectRecord.data.length > 0 && userInsectRecord.data[0].foundCount !== undefined) {
          finalFoundCount = userInsectRecord.data[0].foundCount;
        } else {
          // 如果数据有问题，使用默认值0
          finalFoundCount = 0;
          console.log('编辑模式警告：无法获取有效的原始发现次数，使用默认值0');
        }
        
        // 注意：前端传递的currentFoundCount的验证和强制使用已移至最终安全检查中
        // 这里仅使用原始记录的发现次数，最终安全检查会确保返回正确的值
        console.log('编辑模式：当前使用原始记录的发现次数:', finalFoundCount);
        
        console.log('编辑模式：返回原始发现次数:', finalFoundCount);
        // 增加额外的检查和日志，确保编辑模式下发现次数不会被增加
        console.log('编辑模式保护：确认原始发现次数为:', finalFoundCount);
        console.log('编辑模式关键保护：避免任何数据库查询，直接使用传入云函数时获取的原始次数');
        console.log('编辑模式严格验证：返回的发现次数严格等于原始值:', finalFoundCount === (userInsectRecord.data[0].foundCount || 0));
        console.log('编辑模式客户端验证：返回的发现次数与前端报告次数是否一致:', finalFoundCount === clientReportedCount);
      } else {
        // 新发现模式：直接使用我们设置的发现次数1
        // 重要修复：不重新查询数据库，避免返回旧的发现次数
        finalFoundCount = 1;
        console.log('新发现模式：直接返回重置的发现次数1');
      }
    } else {
      // 新记录的情况下
      finalFoundCount = 1;
      console.log('新记录：返回发现次数:', finalFoundCount);
    }
    
    // 最终安全检查：确保在编辑模式下返回的发现次数严格等于前端传递的值
    // 重要修复：只在编辑现有记录时进行强制覆盖，不要影响新创建的记录
    if (!shouldIncrementCount && clientReportedCount !== undefined && userInsectRecord.data.length > 0) {
      console.log('===== 最终安全检查开始 =====');
      console.log('编辑模式：最终安全检查 - 确保返回的发现次数严格等于前端传递的值');
      console.log('检查前finalFoundCount:', finalFoundCount);
      console.log('前端传递的clientReportedCount:', clientReportedCount);
      console.log('安全检查条件：是否是现有记录:', userInsectRecord.data.length > 0);
      
      // 强制覆盖finalFoundCount，确保编辑模式下始终返回前端传递的值
      finalFoundCount = clientReportedCount;
      console.log('编辑模式：最终安全检查 - 已强制将finalFoundCount设置为前端传递的值:', finalFoundCount);
      console.log('===== 最终安全检查结束 =====');
    } else if (userInsectRecord.data.length === 0) {
      // 对于新创建的记录，确保返回的发现次数始终是1，不受前端传递值的影响
      console.log('新创建记录安全检查：强制确保发现次数为1');
      finalFoundCount = 1;
    }
    
    const returnData = {
      success: true,
      message: '发现记录已更新',
      isNewRecord: userInsectRecord.data.length === 0,
      foundCount: finalFoundCount,
      data: {
        insectId: insectId,
        name: normalizedName,
        totalFound: totalFound.total,
        totalInsects: totalInsects.total,
        insectInfo: insectData,
        // 添加调试信息
        debugInfo: {
          isNewDiscovery: isNewDiscovery,
          shouldIncrementCount: shouldIncrementCount,
          updatedAt: new Date().toISOString()
        }
      }
    };
    
    console.log('云函数返回数据:', JSON.stringify(returnData));
    console.log('===== markFound云函数完成 =====');
    
    return returnData;
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