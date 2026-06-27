// 昆虫数据同步脚本
// 用于同步 insects 集合和 user_insects 集合中的昆虫数据
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

/**
 * 同步昆虫数据
 * 1. 从 user_insects 集合中提取所有唯一的昆虫
 * 2. 将这些昆虫添加到 insects 集合（如果不存在）
 * 3. 更新 insects 集合中昆虫的识别次数统计
 */
async function syncInsectData() {
  try {
    console.log('开始同步昆虫数据...');
    
    // 1. 获取 user_insects 集合中的所有唯一昆虫
    console.log('从 user_insects 集合中提取昆虫数据...');
    
    // 查询所有用户昆虫记录
    let userInsects = [];
    let hasMore = true;
    let skip = 0;
    const pageSize = 100;
    
    while (hasMore) {
      const result = await db.collection('user_insects')
        .skip(skip)
        .limit(pageSize)
        .get();
      
      if (result.data.length > 0) {
        userInsects = [...userInsects, ...result.data];
        skip += pageSize;
        hasMore = result.data.length === pageSize;
        console.log(`已提取 ${userInsects.length} 条用户昆虫记录...`);
      } else {
        hasMore = false;
      }
    }
    
    console.log(`共提取 ${userInsects.length} 条用户昆虫记录`);
    
    // 去重，创建昆虫ID到信息的映射
    const insectMap = new Map();
    
    userInsects.forEach(record => {
      const insectId = record.insectId || record.name.toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      
      if (!insectMap.has(insectId)) {
        insectMap.set(insectId, {
          id: insectId,
          name: record.name,
          recognizeCount: record.foundCount || 0,
          imageUrl: record.userImageUrl || '',
          baikeInfo: record.baikeInfo || {},
          firstFoundTime: record.createdAt || new Date(),
          lastFoundTime: record.lastFoundTime || new Date()
        });
      } else {
        // 更新识别次数和最后发现时间
        const existingInsect = insectMap.get(insectId);
        existingInsect.recognizeCount += (record.foundCount || 0);
        existingInsect.lastFoundTime = existingInsect.lastFoundTime > record.lastFoundTime ? 
          existingInsect.lastFoundTime : record.lastFoundTime;
        
        // 如果有图片且当前没有图片，则更新图片
        if (!existingInsect.imageUrl && record.userImageUrl) {
          existingInsect.imageUrl = record.userImageUrl;
        }
      }
    });
    
    console.log(`去重后得到 ${insectMap.size} 种昆虫`);
    
    // 2. 检查 insects 集合中的现有昆虫
    console.log('查询 insects 集合中的现有昆虫...');
    const existingInsects = await db.collection('insects').get();
    const existingInsectIds = new Set(existingInsects.data.map(insect => insect._id));
    
    console.log(`insects 集合中已有 ${existingInsectIds.size} 种昆虫`);
    
    // 3. 添加新昆虫到 insects 集合
    let addedCount = 0;
    let updatedCount = 0;
    
    for (const [insectId, insectInfo] of insectMap.entries()) {
      // 准备昆虫数据
      const insectData = {
        name: insectInfo.name,
        recognizeCount: insectInfo.recognizeCount,
        updateTime: db.serverDate()
      };
      
      // 只在有图片时更新图片URL
      if (insectInfo.imageUrl) {
        insectData.imageUrl = insectInfo.imageUrl;
      }
      
      // 尝试提取分类信息（如果百科信息中有）
      if (insectInfo.baikeInfo && insectInfo.baikeInfo.category) {
        insectData.category = insectInfo.baikeInfo.category;
      }
      
      if (existingInsectIds.has(insectId)) {
        // 更新现有昆虫
        try {
          const updateResult = await db.collection('insects').doc(insectId).update({
            data: insectData
          });
          updatedCount++;
          console.log(`更新昆虫 ${insectInfo.name} (${insectId}) 成功`);
        } catch (error) {
          console.error(`更新昆虫 ${insectInfo.name} (${insectId}) 失败:`, error);
        }
      } else {
        // 添加新昆虫
        try {
          await db.collection('insects').add({
            data: {
              _id: insectId,
              ...insectData,
              createTime: db.serverDate()
            }
          });
          addedCount++;
          console.log(`添加新昆虫 ${insectInfo.name} (${insectId}) 成功`);
        } catch (error) {
          console.error(`添加新昆虫 ${insectInfo.name} (${insectId}) 失败:`, error);
        }
      }
    }
    
    console.log('昆虫数据同步完成！');
    console.log(`- 新增昆虫: ${addedCount}`);
    console.log(`- 更新昆虫: ${updatedCount}`);
    console.log(`- 总昆虫数: ${insectMap.size}`);
    
    return {
      success: true,
      addedCount,
      updatedCount,
      totalCount: insectMap.size,
      message: '昆虫数据同步完成'
    };
    
  } catch (error) {
    console.error('昆虫数据同步失败:', error);
    return {
      success: false,
      error: error.message,
      message: '昆虫数据同步失败'
    };
  }
}

// 导出主函数供云函数调用
if (typeof module !== 'undefined' && module.exports) {
  exports.main = syncInsectData;
}

// 如果直接运行脚本（在本地环境）
if (require.main === module) {
  syncInsectData().then(result => {
    console.log('同步结果:', result);
  }).catch(error => {
    console.error('同步失败:', error);
  });
}