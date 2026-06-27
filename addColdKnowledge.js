// 简易冷知识数据添加工具
// 使用方法：
// 1. 将您的97条冷知识数据粘贴到下面的userColdKnowledge数组中
// 2. 运行此脚本：node addColdKnowledge.js
// 3. 脚本会自动生成完整的insectColdKnowledge.js文件内容

const fs = require('fs');
const path = require('path');

// 用户冷知识数据 - 请将您的97条数据粘贴到这里
const userColdKnowledge = [
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
  },
  {
      "id": 4,
      "category": "身体构造",
      "content": "蚊子的翅膀振动频率高达每秒几百次，这才产生了让人烦躁的'嗡嗡'声。",
      "related_insects": ["蚊子"],
      "season": "summer"
    },
    {
      "id": 5,
      "category": "身体构造",
      "content": "萤火虫的发光器几乎能将化学能100%转化为光能，是真正的'冷光源'。",
      "related_insects": ["萤火虫"],
      "season": "summer"
    },
    {
      "id": 6,
      "category": "生存策略",
      "content": "瓢虫遇到危险时，会从关节处分泌出难闻的黄色液体来吓退敌人。",
      "related_insects": ["瓢虫"],
      "season": "spring"
    }
  // 在这里粘贴剩余的97条数据
];

// 季节映射
const seasonMap = {
  'summer': ['夏季'],
  'winter': ['冬季'],
  'spring': ['春季'],
  'autumn': ['秋季'],
  'all': ['全年']
};

// 生成季节性提示
function generateSeasonalTip(seasonArray, insects) {
  const monthMap = {
    ['夏季']: { month: '6-8月', description: '夏季是观察昆虫的好时机' },
    ['冬季']: { month: '12-2月', description: '冬季昆虫活动减少' },
    ['春季']: { month: '3-5月', description: '春季昆虫开始活跃' },
    ['秋季']: { month: '9-11月', description: '秋季昆虫准备越冬' },
    ['全年']: { month: '全年', description: '这些昆虫全年可见' }
  };
  
  const monthInfo = monthMap[seasonArray] || monthMap[['全年']];
  
  return [{
    month: monthInfo.month,
    description: monthInfo.description,
    tips: `观察${insects.join('和')}时请保持安静，不要惊吓它们。`,
    active_insects: insects.slice(0, 2) // 最多显示2种昆虫
  }];
}

// 转换数据格式
const convertedData = userColdKnowledge.map((item, index) => {
  const seasonArray = seasonMap[item.season] || ['全年'];
  return {
    id: String(index + 1).padStart(3, '0'),
    category: item.category,
    content: item.content,
    related_insects: item.related_insects,
    season: seasonArray,
    seasonal_tips: generateSeasonalTip(seasonArray, item.related_insects)
  };
});

// 生成完整的文件内容
const fileContent = `// 昆虫冷知识数据
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

// 输出文件内容到控制台和文件
console.log('\n=== 生成的insectColdKnowledge.js文件内容 ===\n');
console.log(fileContent);

// 尝试写入文件
const outputPath = path.join(__dirname, 'miniprogram', 'utils', 'insectColdKnowledge_generated.js');
try {
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`\n文件已成功生成：${outputPath}`);
  console.log('\n请将生成的文件内容复制到：/Users/pomelo/WeChatProjects/insectBook/miniprogram/utils/insectColdKnowledge.js');
} catch (error) {
  console.error('写入文件失败：', error.message);
  console.log('请手动复制上述内容到目标文件。');
}

console.log('\n=== 使用说明 ===');
console.log('1. 请将您的97条冷知识数据粘贴到userColdKnowledge数组中');
console.log('2. 运行脚本：node addColdKnowledge.js');
console.log('3. 将生成的内容复制到insectColdKnowledge.js文件中');