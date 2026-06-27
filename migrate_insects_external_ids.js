// 昆虫数据迁移脚本 - 为现有昆虫添加externalId
// 这个脚本应该在云函数环境中运行

const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 生成昆虫外部ID的函数
function generateInsectExternalId(insectName, existingCount = 0) {
  // 基本转换：移除特殊字符，保留字母数字和下划线
  const cleanName = insectName
    .toLowerCase()
    .replace(/[\s-]/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  // 添加唯一后缀
  const suffix = existingCount > 0 ? `_${existingCount}` : '';
  
  // 限制长度在50个字符以内
  let finalId = cleanName.substring(0, 50 - suffix.length) + suffix;
  
  // 确保不以数字开头
  if (/^\d/.test(finalId)) {
    finalId = `insect_${finalId}`;
  }
  
  return finalId;
}

// 执行迁移的主函数
async function migrateInsectData() {
  console.log('开始昆虫数据迁移...');
  
  try {
    // 获取所有没有externalId的昆虫记录
    const insectsWithoutExternalId = await db.collection('insects')
      .where({ externalId: db.command.exists(false) })
      .get();
    
    console.log(`找到 ${insectsWithoutExternalId.data.length} 条需要添加externalId的昆虫记录`);
    
    // 记录每个名称生成的次数，用于处理重复名称
    const nameCountMap = {};
    
    // 批量更新昆虫记录
    for (const insect of insectsWithoutExternalId.data) {
      // 增加该名称的计数
      const insectName = insect.name || 'unknown_insect';
      nameCountMap[insectName] = (nameCountMap[insectName] || 0) + 1;
      
      // 生成externalId
      const externalId = generateInsectExternalId(insectName, nameCountMap[insectName] - 1);
      
      // 更新记录
      await db.collection('insects').doc(insect._id).update({
        data: {
          externalId: externalId,
          updatedAt: db.serverDate()
        }
      });
      
      console.log(`已为昆虫 ${insectName} (${insect._id}) 添加externalId: ${externalId}`);
    }
    
    console.log('昆虫数据迁移完成！');
    return { success: true, count: insectsWithoutExternalId.data.length };
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    return { success: false, error: error.message };
  }
}

// 导出迁移函数，便于在云函数中调用
module.exports = { migrateInsectData };

// 如果直接运行此脚本，则执行迁移
if (require.main === module) {
  migrateInsectData().then(result => {
    console.log('迁移结果:', result);
    process.exit(result.success ? 0 : 1);
  });
}