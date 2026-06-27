const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const axios = require('axios')

// 昆虫名称标准化映射，用于优化搜索结果
const INSECT_NAME_MAP = {
  '重陽木锦斑蛾': '重阳木锦斑蛾',
  '斑蛾': '斑蛾',
  '竹节虫': '竹节虫',
  '螳螂': '螳螂',
  '蝴蝶': '蝴蝶',
  '蜜蜂': '蜜蜂',
  '蚂蚁': '蚂蚁',
  '蜻蜓': '蜻蜓',
  '甲虫': '甲虫',
  '瓢虫': '瓢虫',
  '天牛': '天牛',
  '蝉': '蝉'
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
  
  // 返回原始名称
  return name;
}

// 验证图片URL是否有效
async function validateImageUrl(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      // 使用head请求验证URL，设置较短的超时
      const head = await axios.head(url, { 
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      // 检查状态码和内容类型
      if (head.status === 200 && head.headers['content-type'] && head.headers['content-type'].includes('image')) {
        return true;
      }
    } catch (error) {
      // 如果是最后一次重试，返回失败
      if (i === retries) {
        return false;
      }
      // 否则等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  return false;
}

exports.main = async (event, context) => {
  const { keyword } = event
  if (!keyword) return { success: false, msg: '缺关键词' }

  try {
    // 标准化昆虫名称
    const normalizedKeyword = normalizeInsectName(keyword);
    // 优化搜索关键词，增加"昆虫"或特定词汇以获取更相关的结果
    const searchKeyword = normalizedKeyword.includes('虫') || normalizedKeyword.includes('蛾') || normalizedKeyword.includes('蝉') 
      ? normalizedKeyword 
      : `${normalizedKeyword} 昆虫`;

    console.log(`搜索关键词: ${searchKeyword} (原始: ${keyword})`);

    // 百度图片搜索 acjson 接口，优化参数
    const params = {
      tn: 'resultjson_com',
      ipn: 'rj',
      ct: 201326592,
      is: '',
      fp: 'result',
      queryWord: searchKeyword,
      cl: 2,
      lm: -1,
      ie: 'utf-8',
      oe: 'utf-8',
      word: searchKeyword,
      pn: 0,
      rn: 15, // 增加返回数量以提高找到有效图片的概率
      gsm: 0,
      advtype: 0
    }
    
    // 设置请求头模拟浏览器
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://image.baidu.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    };
    
    const { data } = await axios.get('https://image.baidu.com/search/acjson', { 
      params, 
      headers,
      timeout: 10000 // 增加超时时间
    })
    
    if (!data.data || data.data.length === 0) {
      console.log(`未找到 ${searchKeyword} 的图片结果`);
      return { success: false, msg: '无结果' }
    }

    // 尝试多个图片URL，直到找到一个有效的
    let imgUrl = '';
    let validImageFound = false;
    
    // 首先尝试objURL字段
    for (const item of data.data) {
      if (item.objURL && item.objURL.startsWith('http')) {
        const candidateUrl = item.objURL;
        console.log(`尝试图片URL: ${candidateUrl}`);
        
        // 验证图片URL是否有效
        if (await validateImageUrl(candidateUrl)) {
          imgUrl = candidateUrl;
          validImageFound = true;
          break;
        }
      }
    }
    
    // 如果objURL都无效，尝试middleURL字段
    if (!validImageFound) {
      for (const item of data.data) {
        if (item.middleURL && item.middleURL.startsWith('http')) {
          const candidateUrl = item.middleURL;
          console.log(`尝试middleURL: ${candidateUrl}`);
          
          if (await validateImageUrl(candidateUrl)) {
            imgUrl = candidateUrl;
            validImageFound = true;
            break;
          }
        }
      }
    }
    
    // 如果仍然没有找到有效图片，尝试thumbURL字段
    if (!validImageFound) {
      for (const item of data.data) {
        if (item.thumbURL && item.thumbURL.startsWith('http')) {
          const candidateUrl = item.thumbURL;
          console.log(`尝试thumbURL: ${candidateUrl}`);
          
          if (await validateImageUrl(candidateUrl)) {
            imgUrl = candidateUrl;
            validImageFound = true;
            break;
          }
        }
      }
    }
    
    if (validImageFound) {
      console.log(`成功找到有效图片: ${imgUrl}`);
      return { success: true, imageUrl: imgUrl }
    }
    
    return { success: false, msg: '未找到有效图片' }
  } catch (e) {
    console.error(`搜索图片时发生错误: ${e.message}`);
    return { success: false, msg: e.message }
  }
}