// 昆虫图片配置 - 解决微信小程序域名白名单问题
export const IMAGES_CONFIG = {
  // 存储昆虫名称到本地图片路径的映射
  insectToLocalImage: {
    '眼斑螳螂': '/images/insects/eyespot_mantis.png',
    '步甲幼虫': '/images/insects/ground_beetle_larva.png',
    '地鳖': '/images/insects/ground_beetle.png',
    '蝴蝶': '/images/insects/butterfly.png',
    '蜜蜂': '/images/insects/bee.png',
    '蚂蚁': '/images/insects/ant.png',
    '蜻蜓': '/images/insects/dragonfly.png',
    '变色树蜥': '/images/insects/chameleon.png',
    '牡丹鹦鹉': '/images/insects/parrot.png',
    '幽灵螳螂': '/images/insects/ghost_mantis.png',
    '蓝舌石龙子': '/images/insects/blue_tongue_skink.png',
    '中华大扁锹': '/images/insects/chinese_stag_beetle.png',
    '蓝孔雀': '/images/insects/peacock.png',
    '姬兜': '/images/insects/rhinoceros_beetle.png',
    '苏里南潜螈': '/images/insects/amphibian.png',
    '锹甲': '/images/insects/stag_beetle.png',
    '独角仙': '/images/insects/rhinoceros_beetle.png',
    '金龟子': '/images/insects/scarab.png',
    '七星瓢虫': '/images/insects/ladbug.png',
    '竹节虫': '/images/insects/stick_insect.png',
    '沙蟹': '/images/insects/sand_crab.png',
    '黄杨绢野螟': '/images/insects/crambid_moth.png',
    '大刀螳螂': '/images/insects/mantis.png',
    '蓝闪蝶': '/images/insects/blue_butterfly.png',
    '毛虫': '/images/insects/caterpillar.png'
  }
};

// 获取昆虫图片URL - 使用本地图片路径
export function getInsectImageUrl(insectName) {
  // 容错处理：去除名称中的空格
  const normalizedName = insectName.trim();
  
  try {
    // 优先从配置的映射表中查找对应昆虫的本地图片
    if (IMAGES_CONFIG.insectToLocalImage[normalizedName]) {
      return IMAGES_CONFIG.insectToLocalImage[normalizedName];
    } 
    // 如果找不到映射，返回默认图片
    return '/images/default_insect.png';
  } catch (error) {
    console.error('获取昆虫图片URL失败:', error);
    // 如果出现错误，返回默认图片
    return '/images/default_insect.png';
  }
}

// 检查并创建必要的图片目录
export function ensureImageDirectories() {
  // 在小程序环境中，可以在App.js中调用此函数
  // 检查是否需要创建images/insects目录
  // 注意：实际目录创建需要在开发工具中手动完成
  console.log('请确保在miniprogram/images/目录下创建insects文件夹，并将昆虫图片放入其中');
}