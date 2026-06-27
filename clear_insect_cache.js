// 强制清除昆虫详情页面缓存的脚本
// 用于解决由于缓存导致的昆虫详情页加载失败问题

// 缓存键前缀
const CACHE_KEY_PREFIX = 'insect_detail_';

/**
 * 清除所有昆虫详情缓存
 * @returns {Promise<void>}
 */
async function clearAllInsectCaches() {
  try {
    // 获取所有缓存键
    const keys = await wx.getStorageInfoSync();
    console.log('获取到所有存储键:', keys.keys.length);
    
    // 筛选出昆虫详情相关的缓存键
    const insectCacheKeys = keys.keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    console.log(`找到 ${insectCacheKeys.length} 个昆虫详情缓存`);
    
    // 删除每个昆虫详情缓存
    insectCacheKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
        console.log(`成功删除缓存: ${key}`);
      } catch (err) {
        console.error(`删除缓存失败 ${key}:`, err);
      }
    });
    
    console.log('昆虫详情缓存清理完成');
    return { success: true, removedCount: insectCacheKeys.length };
  } catch (error) {
    console.error('清理缓存过程中出错:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 清除指定昆虫ID的缓存
 * @param {string} insectId 昆虫ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function clearSpecificInsectCache(insectId) {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${insectId}`;
    wx.removeStorageSync(cacheKey);
    console.log(`成功删除指定昆虫缓存: ${cacheKey}`);
    return { success: true, message: `成功删除昆虫 ${insectId} 的缓存` };
  } catch (error) {
    console.error(`删除指定昆虫缓存失败 ${insectId}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * 主函数，可根据传入参数决定清理方式
 * @param {Object} options 选项
 * @param {boolean} options.all 是否清理所有缓存
 * @param {string} options.insectId 特定昆虫ID
 */
async function main(options = {}) {
  const { all = false, insectId = '' } = options;
  
  console.log('开始清理昆虫详情缓存...');
  
  if (all) {
    return await clearAllInsectCaches();
  } else if (insectId) {
    return await clearSpecificInsectCache(insectId);
  } else {
    console.log('未指定清理参数，默认清理所有昆虫详情缓存');
    return await clearAllInsectCaches();
  }
}

// 导出函数供小程序调用
module.exports = {
  clearAllInsectCaches,
  clearSpecificInsectCache,
  main
};

// 如果直接运行此脚本（在Node.js环境中）
if (typeof require !== 'undefined' && require.main === module) {
  // 模拟小程序环境的函数
  global.wx = {
    getStorageInfoSync: () => ({
      keys: ['insect_detail_insect_mhlaje2bfn938ar', 'insect_detail_insect_mhlajdxg4qleo6p', 'other_key']
    }),
    removeStorageSync: (key) => {
      console.log(`[模拟] 删除缓存: ${key}`);
      return true;
    }
  };
  
  // 执行清理
  main({ all: true }).then(result => {
    console.log('清理结果:', result);
  });
}