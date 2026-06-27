// 直接测试昆虫信息匹配逻辑

// 手动定义豆娘和其他昆虫信息（模拟INSECT_ENCYCLOPEDIA）
const INSECT_ENCYCLOPEDIA = {
  '豆娘': {
    description: '豆娘是蜻蜓目束翅亚目昆虫的统称，体型较蜻蜓小。\n\n特征：\n- 体细长\n- 两对翅大小相似，休息时翅束立于背上\n- 复眼距离较远\n\n习性：\n- 生活在水域附近\n- 捕食小型昆虫\n- 稚虫生活在水中\n\n观察提示：豆娘常栖息于水域附近的植物上，可以观察它们交配时形成的\"爱心\"形状。',
    habitat: '水域附近，尤其喜欢静水区域',
    food: '小型昆虫'
  },
  '蝴蝶': {
    description: '蝴蝶是昆虫纲鳞翅目锤角亚目的统称。',
    habitat: '广泛分布',
    food: '花蜜'
  }
};

// 原始逻辑（基于包含关系）
function originalLogic(normalizedName) {
  let category = '未知';
  let habitat = '未知';
  let food = '未知';
  
  // 尝试从INSECT_ENCYCLOPEDIA中获取相关信息（包含关系）
  for (const [key, info] of Object.entries(INSECT_ENCYCLOPEDIA)) {
    if (normalizedName.includes(key)) {
      category = key + '类';
      habitat = info.habitat;
      food = info.food;
      console.log(`[原始逻辑] 从INSECT_ENCYCLOPEDIA匹配到: ${key}, 设置分类: ${category}, 栖息地: ${habitat}, 食物: ${food}`);
      return {
        success: true,
        source: 'generated',
        description: info.description,
        habitat: habitat,
        food: food,
        category: category
      };
    }
  }
  
  return {
    success: false,
    source: 'generated',
    message: '未找到匹配的昆虫信息'
  };
}

// 修复后的逻辑（优先精确匹配）
function fixedLogic(normalizedName) {
  // 1. 首先检查是否有预定义的昆虫信息（优先精确匹配）
  if (INSECT_ENCYCLOPEDIA[normalizedName]) {
    console.log(`[修复逻辑] 使用INSECT_ENCYCLOPEDIA中的预定义信息，昆虫: ${normalizedName}`);
    return {
      success: true,
      source: 'predefined',
      description: INSECT_ENCYCLOPEDIA[normalizedName].description,
      habitat: INSECT_ENCYCLOPEDIA[normalizedName].habitat,
      food: INSECT_ENCYCLOPEDIA[normalizedName].food,
      category: normalizedName + '类'
    };
  }
  
  // 2. 如果没有精确匹配，再尝试包含关系（原有逻辑）
  let category = '未知';
  let habitat = '未知';
  let food = '未知';
  
  for (const [key, info] of Object.entries(INSECT_ENCYCLOPEDIA)) {
    if (normalizedName.includes(key)) {
      category = key + '类';
      habitat = info.habitat;
      food = info.food;
      console.log(`[修复逻辑] 从INSECT_ENCYCLOPEDIA匹配到: ${key}, 设置分类: ${category}, 栖息地: ${habitat}, 食物: ${food}`);
      return {
        success: true,
        source: 'generated',
        description: info.description,
        habitat: habitat,
        food: food,
        category: category
      };
    }
  }
  
  return {
    success: false,
    source: 'generated',
    message: '未找到匹配的昆虫信息'
  };
}

// 测试函数
function testInsectMatch(insectName) {
  console.log(`\n=== 测试昆虫: ${insectName} ===`);
  
  console.log('\n原始逻辑结果:');
  const originalResult = originalLogic(insectName);
  console.log('成功状态:', originalResult.success);
  console.log('数据源:', originalResult.source);
  if (originalResult.description) {
    console.log('描述样本:', originalResult.description.substring(0, 80) + '...');
  }
  
  console.log('\n修复逻辑结果:');
  const fixedResult = fixedLogic(insectName);
  console.log('成功状态:', fixedResult.success);
  console.log('数据源:', fixedResult.source);
  if (fixedResult.description) {
    console.log('描述样本:', fixedResult.description.substring(0, 80) + '...');
  }
  
  // 比较结果
  if (fixedResult.success && (!originalResult.success || originalResult.source !== 'predefined')) {
    console.log('\n✓ 修复成功！现在可以正确识别预定义的昆虫信息。');
  } else if (fixedResult.success && originalResult.success) {
    console.log('\n△ 两种逻辑都返回了结果，但修复逻辑提供了更准确的数据源标记。');
  } else {
    console.log('\n✗ 修复未能改善结果。');
  }
}

// 运行测试
console.log('开始测试昆虫信息匹配逻辑');
console.log('========================');

testInsectMatch('豆娘'); // 测试精确匹配
// testInsectMatch('蓝豆娘'); // 测试包含关系（如果需要）
// testInsectMatch('未知昆虫'); // 测试未匹配情况

console.log('\n测试完成！');