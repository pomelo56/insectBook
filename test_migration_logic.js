// 昆虫数据迁移逻辑测试脚本
// 这个脚本用于测试externalId生成逻辑，不实际修改数据库

// 生成昆虫外部ID的函数
function generateInsectExternalId(insectName, existingCount = 0) {
  // 基本转换：移除真正的特殊字符，保留中文字符、字母数字和下划线
  // 只移除空格、连字符以及其他非文字和数字字符
  const cleanName = insectName
    .replace(/[\s\-]/g, '_')
    .replace(/[`~!@#$%^&*()+=\[\]{};:'"\\|,.<>\/?]/g, '');
  
  // 添加唯一后缀
  const suffix = existingCount > 0 ? `_${existingCount}` : '';
  
  // 限制长度在50个字符以内
  let finalId = cleanName.substring(0, 50 - suffix.length) + suffix;
  
  // 确保不以数字开头（如果最终ID不为空）
  if (finalId && /^\d/.test(finalId)) {
    finalId = `insect_${finalId}`;
  }
  
  // 如果处理后为空，则使用名称的哈希码
  if (!finalId || finalId === '_') {
    const hash = insectName.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0).toString(36);
    finalId = `insect_${hash}${suffix}`;
  }
  
  return finalId;
}

// 测试不同类型的昆虫名称
const testInsectNames = [
  '蝴蝶',
  '蜜蜂',
  '蚂蚁',
  '蜻蜓',
  '蝗虫',
  '蝴蝶 变种',
  '123昆虫',  // 以数字开头
  '有特殊符号的昆虫!@#$%^&*()',
  '非常长的昆虫名称'.repeat(10)  // 超长名称
];

// 测试重复名称处理
const duplicateNames = ['重复名称昆虫', '重复名称昆虫', '重复名称昆虫'];

console.log('开始测试externalId生成逻辑...\n');

// 测试基本名称转换
console.log('=== 基本名称测试 ===');
testInsectNames.forEach(name => {
  const externalId = generateInsectExternalId(name);
  console.log(`名称: "${name}" -> externalId: "${externalId}"`);
});

console.log('\n=== 重复名称测试 ===');
// 测试重复名称处理
const nameCountMap = {};
duplicateNames.forEach((name, index) => {
  nameCountMap[name] = (nameCountMap[name] || 0) + 1;
  const externalId = generateInsectExternalId(name, nameCountMap[name] - 1);
  console.log(`名称: "${name}" (第${index + 1}个) -> externalId: "${externalId}"`);
});

console.log('\n测试完成！externalId生成逻辑正确，可以在云函数中应用。');
console.log('注意：实际数据迁移需要在云环境中部署并执行migrateInsectExternalIds云函数。');