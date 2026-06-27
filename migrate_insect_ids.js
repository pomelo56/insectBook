// migrate_insect_ids.js - 昆虫ID系统迁移脚本
const cloud = require('wx-server-sdk');
const { generateInsectExternalId } = require('./miniprogram/utils/idGenerator');

// 初始化云环境
cloud.init();
const db = cloud.database();
const _ = db.command;

/**
 * 迁移昆虫ID系统
 * 1. 为所有昆虫添加externalId字段
 * 2. 记录旧ID到新ID的映射关系
 */
async function migrateInsectIds() {
  try {
    console.log('开始昆虫ID系统迁移...');
    
    // 1. 为insects集合中的昆虫添加externalId
    console.log('开始为昆虫添加externalId...');
    let totalInsects = 0;
    let migratedCount = 0;
    let hasMore = true;
    let skip = 0;
    const batchSize = 100;
    const idMapping = new Map(); // 用于存储旧ID到新ID的映射
    
    while (hasMore) {
      // 分批查询昆虫数据
      const queryResult = await db.collection('insects')
        .skip(skip)
        .limit(batchSize)
        .get();
      
      const insects = queryResult.data;
      totalInsects += insects.length;
      
      if (insects.length === 0) {
        hasMore = false;
        break;
      }
      
      // 为每只昆虫添加externalId（如果还没有的话）
      for (const insect of insects) {
        if (!insect.externalId) {
          const externalId = generateInsectExternalId();
          
          // 更新昆虫记录
          await db.collection('insects').doc(insect._id).update({
            data: { externalId }
          });
          
          // 记录映射关系
          idMapping.set(insect._id, externalId);
          migratedCount++;
          
          console.log(`已为昆虫 ${insect.name || '未知名称'} (ID: ${insect._id}) 添加externalId: ${externalId}`);
        }
      }
      
      skip += batchSize;
      
      // 添加短暂延迟，避免请求过于密集
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`昆虫externalId迁移完成，总共处理 ${totalInsects} 只昆虫，成功迁移 ${migratedCount} 只`);
    
    // 2. 保存映射关系到数据库（可选）
    try {
      await db.collection('insect_id_mappings').doc('current_mapping').set({
        data: {
          mappings: Array.from(idMapping.entries()).map(([oldId, newId]) => ({ oldId, newId })),
          migrateTime: db.serverDate(),
          version: 'v1'
        }
      });
      console.log('ID映射关系已保存到数据库');
    } catch (err) {
      console.warn('保存ID映射关系失败:', err);
      // 保存映射关系到文件
      const fs = require('fs');
      fs.writeFileSync('./insect_id_mapping.json', JSON.stringify(Array.from(idMapping.entries()), null, 2));
      console.log('ID映射关系已保存到文件');
    }
    
    console.log('昆虫ID系统迁移完成！');
    return {
      success: true,
      totalInsects,
      migratedCount,
      message: '昆虫ID系统迁移成功'
    };
  } catch (error) {
    console.error('昆虫ID系统迁移失败:', error);
    return {
      success: false,
      error: error.message,
      message: '昆虫ID系统迁移失败'
    };
  }
}

// 本地测试入口
if (require.main === module) {
  migrateInsectIds().then(result => {
    console.log('迁移结果:', result);
  });
}

module.exports = { migrateInsectIds };