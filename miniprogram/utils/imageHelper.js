// 关键词 → 图片URL获取函数

// 获取小程序实例
const app = getApp();

// 内存缓存，避免短时间内重复请求
const imageCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 缓存有效期：5分钟

// 正在进行的请求，避免重复发起相同的请求
const pendingRequests = new Map();

// 检查并根据版本号清除缓存
function checkVersionAndClearCache() {
  try {
    const appVersion = app?.globalData?.appVersion || '1.0.0';
    const cachedVersion = wx.getStorageSync('imageCacheVersion');
    
    // 如果版本号不同，清除所有图片缓存
    if (appVersion !== cachedVersion) {
      console.log(`检测到新版本 ${appVersion}，清除旧版本 ${cachedVersion} 的图片缓存`);
      imageCache.clear();
      wx.removeStorageSync('insectImagesCache'); // 清除本地存储的图片缓存
      wx.setStorageSync('imageCacheVersion', appVersion); // 更新缓存版本号
    }
  } catch (e) {
    console.error('检查版本并清除缓存时出错:', e);
  }
}

// 初始化时检查版本并清除缓存
checkVersionAndClearCache();

// 昆虫名称标准化映射 - 保持与云函数一致
const INSECT_NAME_MAP = {
  '重陽木锦斑蛾': '重阳木锦斑蛾',
  '斑蛾': '斑蛾',
  '竹节虫': '竹节虫',
  '牡丹鹦鹉': '牡丹鹦鹉'
};

// 标准化昆虫名称
function normalizeInsectName(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }
  
  // 去除可能的前后空格
  name = name.trim();
  
  // 检查是否有完全匹配的标准化名称
  if (INSECT_NAME_MAP[name]) {
    return INSECT_NAME_MAP[name];
  }
  
  return name;
}

// 尝试从多个来源获取图片，增加成功率
const getBaiduImageUrl = async function(keyword, options = {}) {
  // 确保options参数正确解析
  const retryCount = options.retryCount || 0;
  const source = options.source || 'unknown';
  
  // 确保关键词有效
  if (!keyword || typeof keyword !== 'string') {
    return '/images/empty_insect.png';
  }
  
  // 标准化昆虫名称
  const normalizedKeyword = normalizeInsectName(keyword);
  
  // 检查内存缓存
  const cacheKey = `${normalizedKeyword}_${source}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.imageUrl;
  }
  
  // 检查是否有相同的请求正在进行
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // 创建新的请求Promise并加入pending队列
  const requestPromise = (async () => {
    try {
      console.log(`获取图片: ${normalizedKeyword} (来源: ${source})`);
      
      // 1. 直接使用百度图片搜索作为首选
      try {
        console.log('尝试百度图片搜索...');
        const { result } = await wx.cloud.callFunction({
          name: 'baiduImageSearch',
          data: { keyword: normalizedKeyword },
          config: {
            timeout: 15000 // 增加超时时间
          }
        });
        
        if (result && result.success && result.imageUrl) {
          // 添加特殊标记，用于在昆虫详情页识别这是来自百度搜索的图片
          const imageUrl = result.imageUrl;
          const urlWithSource = imageUrl.includes('?') ? 
            `${imageUrl}&source=baidu_${source}` : 
            `${imageUrl}?source=baidu_${source}`;
          
          // 缓存结果
          imageCache.set(cacheKey, { imageUrl: urlWithSource, timestamp: Date.now() });
          console.log('百度图片搜索成功');
          return urlWithSource;
        }
        console.log('百度图片搜索失败或无结果');
      } catch (e) {
        console.error('百度图片搜索异常:', e);
        // 静默失败，继续尝试其他方法
      }
      
      // 2. 如果是特定昆虫（如牡丹鹦鹉），尝试使用专用关键词
      if (normalizedKeyword === '牡丹鹦鹉') {
        try {
          console.log('尝试使用专用关键词搜索牡丹鹦鹉...');
          const { result } = await wx.cloud.callFunction({
            name: 'baiduImageSearch',
            data: { keyword: '牡丹鹦鹉 鸟类' }
          });
          
          if (result && result.success && result.imageUrl) {
            const imageUrl = result.imageUrl;
            const urlWithSource = imageUrl.includes('?') ? 
              `${imageUrl}&source=baidu_specific` : 
              `${imageUrl}?source=baidu_specific`;
            
            imageCache.set(cacheKey, { imageUrl: urlWithSource, timestamp: Date.now() });
            console.log('专用关键词搜索成功');
            return urlWithSource;
          }
        } catch (e) {
          console.error('专用关键词搜索异常:', e);
        }
      }
      
      // 3. 使用getInsectImages云函数作为备选搜索引擎
      try {
        console.log('尝试getInsectImages云函数...');
        const { result } = await wx.cloud.callFunction({
          name: 'getInsectImages',
          data: { insectName: normalizedKeyword }
        });
        
        let imageUrl = null;
        if (result && result.success) {
          if (result.data && result.data.imageUrl) {
            imageUrl = result.data.imageUrl;
          } else if (result.imageUrl) {
            imageUrl = result.imageUrl;
          } else if (result.url) {
            imageUrl = result.url;
          }
          
          if (imageUrl) {
            // 添加特殊标记，用于在昆虫详情页识别这是来自getInsectImages的图片
            const urlWithSource = imageUrl.includes('?') ? 
              `${imageUrl}&source=getInsectImages_${source}` : 
              `${imageUrl}?source=getInsectImages_${source}`;
            
            // 缓存结果
            imageCache.set(cacheKey, { imageUrl: urlWithSource, timestamp: Date.now() });
            console.log('getInsectImages云函数成功');
            return urlWithSource;
          }
        }
        console.log('getInsectImages云函数失败或无结果');
      } catch (e) {
        console.error('getInsectImages云函数异常:', e);
        // 静默失败，继续尝试
      }
      
      // 不再使用特定昆虫的备选图片，统一使用灰态的小程序LOGO作为默认图片
      // 直接跳转到返回默认图片的逻辑
      
      // 如果所有搜索引擎都失败，返回灰态的小程序LOGO作为统一默认图片
      console.log('所有方法都失败，返回灰态的小程序LOGO');
      imageCache.set(cacheKey, { imageUrl: '/images/empty_insect.png', timestamp: Date.now() });
      return '/images/empty_insect.png';
    } catch (e) {
      console.error('获取图片时发生异常:', e);
      // 静默失败，返回灰态的小程序LOGO
      return '/images/empty_insect.png';
    } finally {
      // 无论成功失败，都从pending队列中移除
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // 将请求Promise加入pending队列
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
};

// 导出清除缓存的方法，供需要时使用
export const clearImageCache = () => {
  imageCache.clear();
  try {
    wx.removeStorageSync('insectImagesCache');
    console.log('内存和本地存储图片缓存已清除');
  } catch (e) {
    console.error('清除本地存储缓存失败:', e);
    console.log('内存缓存已清除，但本地存储缓存清除失败');
  }
};

// 强制刷新缓存方法，用于发版后立即更新所有图片
// 在app.js中发版时更新版本号即可触发自动清除缓存
export const forceRefreshAllCaches = () => {
  try {
    // 清除所有类型的缓存
    clearImageCache();
    
    // 清除用户数据缓存
    wx.removeStorageSync('userDataCache');
    wx.removeStorageSync('recentInsectsCache');
    
    console.log('已强制刷新所有缓存');
  } catch (e) {
    console.error('强制刷新缓存失败:', e);
  }
};

// 导出获取缓存大小的方法，用于调试
export const getCacheSize = () => {
  return imageCache.size;
};

// 仅导出未使用export const方式导出的函数
export { getBaiduImageUrl };