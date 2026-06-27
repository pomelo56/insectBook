const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 昆虫名称标准化映射 - 与baiduImageSearch云函数保持一致
const INSECT_NAME_MAP = {
  '重陽木锦斑蛾': '重阳木锦斑蛾',
  '斑蛾': '斑蛾',
  '竹节虫': '竹节虫',
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
  '尺蠖': '尺蠖',
  '蝇': '蝇',
  '蚊子': '蚊子',
  '蚤蝇': '蚤蝇',
  '叶蝉': '叶蝉',
  '沫蝉': '沫蝉',
  '毛虫': '毛虫',
  '重阳木锦斑蛾': '重阳木锦斑蛾'
};

// 标准化昆虫名称
function normalizeInsectName(name) {
  if (!name || typeof name !== 'string') {
    return '未知昆虫';
  }
  
  // 去除可能的前后空格
  name = name.trim();
  
  // 检查是否有完全匹配的标准化名称
  if (INSECT_NAME_MAP[name]) {
    return INSECT_NAME_MAP[name];
  }
  
  // 如果没有完全匹配，检查是否包含关键字
  for (const [key, value] of Object.entries(INSECT_NAME_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }
  
  // 如果都没有匹配，返回原始名称
  return name;
}

// 昆虫图片URL来源优先级
const IMAGE_SOURCES = {
  // 1. 本地图片（存储在云存储中，最稳定）
  local: {
    '螳螂': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/mantis.png',
    '蝴蝶': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/butterfly.png',
    '蜜蜂': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/bee.png',
    '蚂蚁': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/ant.png',
    '蜻蜓': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/dragonfly.png',
    '甲虫': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/beetle.png',
    '瓢虫': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/ladybug.png',
    '天牛': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/longhorn_beetle.png',
    '蝉': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/cicada.png',
    '蟑螂': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/cockroach.png',
    '竹节虫': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/stick_insect.svg',
    '重阳木锦斑蛾': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/butterfly.png',
    '蟋蟀': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/cricket.png',
    '蝗虫': 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/insects/grasshopper.png'
  },
  
  // 2. 备用稳定图片URL（来自可靠的公共CDN）
  cdn: {
    '螳螂': 'https://picsum.photos/id/100/500/375',
    '蝴蝶': 'https://picsum.photos/id/101/500/375',
    '蜜蜂': 'https://picsum.photos/id/102/500/375',
    '蚂蚁': 'https://picsum.photos/id/103/500/375',
    '蜻蜓': 'https://picsum.photos/id/104/500/375',
    '甲虫': 'https://picsum.photos/id/105/500/375',
    '瓢虫': 'https://picsum.photos/id/106/500/375',
    '天牛': 'https://picsum.photos/id/107/500/375',
    '蝉': 'https://picsum.photos/id/108/500/375',
    '蟑螂': 'https://picsum.photos/id/109/500/375',
    '竹节虫': 'https://picsum.photos/id/110/500/375',
    '重阳木锦斑蛾': 'https://picsum.photos/id/111/500/375'
  },
  
  // 3. 默认图片URL（作为最后的备选）
  default: {
    insect: 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/default_insect.png',
    error: 'cloud://insectbook-9g6d16l50a6c5b4b.696e-insectbook-9g6d16l50a6c5b4b-1327662693/images/empty_insect.png'
  }
};

/**
 * 验证图片URL是否可访问
 * @param {string} url - 图片URL
 * @returns {Promise<boolean>} - 是否可访问
 */
async function validateImageUrl(url) {
  try {
    // 简单的URL格式验证
    if (!url || !url.startsWith('http')) {
      return false;
    }
    
    // 在云函数中，我们可以使用HTTP请求来验证URL是否有效
    // 这里简化处理，仅验证URL格式
    return true;
  } catch (error) {
    console.error('验证图片URL失败:', error);
    return false;
  }
}

/**
 * 获取昆虫图片URL
 * @param {string} insectName - 昆虫名称
 * @param {string} sourceType - 图片来源类型 (local, cdn, all)
 * @returns {Promise<{url: string, source: string, success: boolean}>} - 图片信息
 */
async function getInsectImage(insectName, sourceType = 'all') {
  try {
    const normalizedName = normalizeInsectName(insectName);
    console.log('获取昆虫图片:', { insectName, normalizedName, sourceType });
    
    // 1. 优先从本地图片库获取
    if (sourceType === 'all' || sourceType === 'local') {
      const localImage = IMAGE_SOURCES.local[normalizedName];
      if (localImage) {
        console.log('从本地图片库获取到图片:', localImage);
        return {
          url: localImage,
          source: 'local',
          success: true
        };
      }
    }
    
    // 2. 从CDN获取备用图片
    if (sourceType === 'all' || sourceType === 'cdn') {
      const cdnImage = IMAGE_SOURCES.cdn[normalizedName];
      if (cdnImage) {
        console.log('从CDN获取到图片:', cdnImage);
        return {
          url: cdnImage,
          source: 'cdn',
          success: true
        };
      }
    }
    
    // 3. 从数据库获取（如果有）
    try {
      const insectDoc = await db.collection('insects').doc(normalizedName).get();
      if (insectDoc.data && insectDoc.data.imageUrl) {
        console.log('从数据库获取到图片:', insectDoc.data.imageUrl);
        return {
          url: insectDoc.data.imageUrl,
          source: 'database',
          success: true
        };
      }
    } catch (dbError) {
      console.log('数据库查询失败，可能昆虫不存在:', dbError.message);
    }
    
    // 4. 如果没有找到特定昆虫的图片，返回默认图片
    console.log('未找到特定昆虫图片，返回默认图片');
    return {
      url: IMAGE_SOURCES.default.insect,
      source: 'default',
      success: true
    };
  } catch (error) {
    console.error('获取昆虫图片失败:', error);
    return {
      url: IMAGE_SOURCES.default.error,
      source: 'error',
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取所有昆虫的图片映射
 * @returns {Promise<{[key: string]: string}>} - 昆虫名称到图片URL的映射
 */
async function getAllInsectImages() {
  try {
    const imagesMap = {};
    
    // 首先使用本地预设的图片映射
    for (const [insectName, imageUrl] of Object.entries(IMAGE_SOURCES.local)) {
      imagesMap[insectName] = imageUrl;
    }
    
    // 然后补充CDN图片
    for (const [insectName, imageUrl] of Object.entries(IMAGE_SOURCES.cdn)) {
      if (!imagesMap[insectName]) {
        imagesMap[insectName] = imageUrl;
      }
    }
    
    // 最后从数据库获取额外的昆虫图片
    try {
      const insectsCollection = await db.collection('insects').get();
      insectsCollection.data.forEach(insect => {
        if (insect.name && insect.imageUrl && !imagesMap[insect.name]) {
          imagesMap[insect.name] = insect.imageUrl;
        }
      });
    } catch (dbError) {
      console.log('数据库查询失败，使用预设图片:', dbError.message);
    }
    
    console.log('获取所有昆虫图片映射完成，共', Object.keys(imagesMap).length, '种昆虫');
    return imagesMap;
  } catch (error) {
    console.error('获取所有昆虫图片失败:', error);
    return IMAGE_SOURCES.local; // 返回本地预设图片作为备选
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('===== getInsectImages云函数开始 =====');
  console.log('接收到的event参数:', JSON.stringify(event));
  
  const { insectName, getAll, sourceType } = event;
  
  try {
    // 如果指定了获取所有昆虫图片
    if (getAll) {
      console.log('获取所有昆虫图片');
      const allImages = await getAllInsectImages();
      return {
        success: true,
        message: '获取所有昆虫图片成功',
        data: {
          images: allImages,
          count: Object.keys(allImages).length
        }
      };
    }
    
    // 如果指定了昆虫名称，获取单个昆虫图片
    if (insectName) {
      console.log('获取单个昆虫图片:', insectName);
      const imageInfo = await getInsectImage(insectName, sourceType);
      
      return {
        success: imageInfo.success,
        message: imageInfo.success ? '获取昆虫图片成功' : '获取昆虫图片失败',
        data: {
          insectName: normalizeInsectName(insectName),
          imageUrl: imageInfo.url,
          source: imageInfo.source,
          ...(imageInfo.error && { error: imageInfo.error })
        }
      };
    }
    
    // 如果既没有指定获取所有，也没有指定昆虫名称，返回错误
    console.log('错误：未指定昆虫名称或获取所有图片标志');
    return {
      success: false,
      message: '参数错误：请指定昆虫名称或设置getAll为true',
      error: 'missing_parameter'
    };
  } catch (error) {
    console.error('getInsectImages云函数执行失败:', error);
    return {
      success: false,
      message: '获取昆虫图片失败',
      error: error.message
    };
  } finally {
    console.log('===== getInsectImages云函数结束 =====');
  }
};