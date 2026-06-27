// 冷知识数据转换脚本
// 使用方法：将您的97条冷知识数据粘贴到下面的inputData数组中，然后运行此脚本

// 季节映射
const seasonMap = {
  'summer': ['夏季'],
  'winter': ['冬季'],
  'spring': ['春季'],
  'autumn': ['秋季'],
  'all': ['全年']
};

// 默认季节性提示模板
function generateDefaultSeasonalTip(season) {
  const monthMap = {
    ['夏季']: { month: '6-8月', description: '夏季昆虫活动活跃', tips: '在清晨和傍晚观察昆虫效果最佳' },
    ['冬季']: { month: '12-2月', description: '冬季昆虫较少活动', tips: '可以寻找昆虫的冬眠场所' },
    ['春季']: { month: '3-5月', description: '春季是昆虫复苏的季节', tips: '在花丛中可以发现许多昆虫' },
    ['秋季']: { month: '9-11月', description: '秋季昆虫开始准备越冬', tips: '观察昆虫的迁徙和储存行为' },
    ['全年']: { month: '全年', description: '这些昆虫全年可见', tips: '随时都可以进行观察' }
  };
  
  const monthInfo = monthMap[season] || monthMap[['全年']];
  return [{
    month: monthInfo.month,
    description: monthInfo.description,
    tips: monthInfo.tips,
    active_insects: []
  }];
}

// 示例输入数据（请替换为您的97条数据）
const inputData = [
  {
    "id": 1,
    "category": "身体构造",
    "content": "蜻蜓的复眼由多达2.8万个小眼组成，视野几乎达到360度。",
    "related_insects": ["蜻蜓"],
    "season": "summer"
  },
  {
    "id": 2,
    "category": "身体构造",
    "content": "蚂蚁的触角既是嗅觉器官，也是'语言'交流工具，通过触碰传递信息。",
    "related_insects": ["蚂蚁"],
    "season": "all"
  },
  {
    "id": 3,
    "category": "身体构造",
    "content": "苍蝇尝味道靠的是脚，它们的脚上有大量味觉感受器。",
    "related_insects": ["苍蝇"],
    "season": "summer"
  }
  // 在这里添加剩余的97条数据
];

// 转换函数
function convertData(input) {
  return input.map(item => {
    const seasonArray = seasonMap[item.season] || ['全年'];
    return {
      id: String(item.id).padStart(3, '0'), // 转换为三位数字符串
      category: item.category,
      content: item.content,
      related_insects: item.related_insects,
      season: seasonArray,
      seasonal_tips: generateDefaultSeasonalTip(seasonArray)
    };
  });
}

// 执行转换
const convertedData = convertData(inputData);

// 生成可直接插入到insectColdKnowledge.js的格式
function generateJSOutput(convertedData) {
  const dataString = JSON.stringify(convertedData, null, 2)
    .replace(/"id":/g, 'id:')
    .replace(/"category":/g, 'category:')
    .replace(/"content":/g, 'content:')
    .replace(/"related_insects":/g, 'related_insects:')
    .replace(/"season":/g, 'season:')
    .replace(/"seasonal_tips":/g, 'seasonal_tips:')
    .replace(/"month":/g, 'month:')
    .replace(/"description":/g, 'description:')
    .replace(/"tips":/g, 'tips:')
    .replace(/"active_insects":/g, 'active_insects:');
  
  return `// 转换后的冷知识数据（可直接复制到insectColdKnowledge.js）
const newColdKnowledgeData = ${dataString};

// 将以上数据合并到现有的insectColdKnowledge数组中`;
}

// 输出结果
console.log(generateJSOutput(convertedData));
console.log('\n请将以上输出复制到insectColdKnowledge.js文件中，替换或合并现有的数组内容。');

// 也可以直接生成完整的文件内容
function generateFullFileContent(convertedData) {
  return `// 昆虫冷知识数据
export const insectColdKnowledge = ${JSON.stringify(convertedData, null, 2)
    .replace(/"id":/g, 'id:')
    .replace(/"category":/g, 'category:')
    .replace(/"content":/g, 'content:')
    .replace(/"related_insects":/g, 'related_insects:')
    .replace(/"season":/g, 'season:')
    .replace(/"seasonal_tips":/g, 'seasonal_tips:')
    .replace(/"month":/g, 'month:')
    .replace(/"description":/g, 'description:')
    .replace(/"tips":/g, 'tips:')
    .replace(/"active_insects":/g, 'active_insects:')};

// 衣物颜色建议
export const clothingTips = [
  "避免穿着鲜艳的颜色，尤其是黄色和蓝色，这些颜色容易吸引昆虫",
  "在野外观察昆虫时，建议穿着中性色调的衣物",
  "长袖衣物和长裤可以有效防止昆虫叮咬"
];

// 观察提示
export const observationTips = [
  "观察昆虫时保持安静，不要突然移动",
  "使用放大镜可以观察到昆虫的更多细节",
  "拍照时尽量不要使用闪光灯，以免惊吓昆虫",
  "记录下观察到的昆虫的行为和特征"
];`;
}

console.log('\n或者使用以下完整的文件内容：');
console.log(generateFullFileContent(convertedData));