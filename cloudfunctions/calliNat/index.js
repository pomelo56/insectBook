// cloudfunctions/calliNat/index.js
const cloud = require('wx-server-sdk');
const rp = require('request-promise');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取百度AI访问令牌
async function getBaiduAccessToken() {
  // 从云开发环境变量中获取百度API密钥
  const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
  const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
  
  if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
    console.error('百度API密钥未配置');
    throw new Error('百度API密钥未配置，请在云函数环境变量中设置');
  }
  
  const options = {
    method: 'POST',
    uri: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`,
    json: true,
    timeout: 10000
  };

  try {
    const response = await rp(options);
    return response.access_token;
  } catch (error) {
    console.error('获取百度访问令牌失败:', error);
    throw new Error('获取访问令牌失败');
  }
}

// 调用百度昆虫识别API
async function recognizeInsect(imageBase64) {
  const accessToken = await getBaiduAccessToken();
  
  const options = {
    method: 'POST',
    uri: `https://aip.baidubce.com/rest/2.0/image-classify/v1/animal?access_token=${accessToken}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      image: imageBase64,
      top_num: 5,
      baike_num: 3
    },
    json: true,
    timeout: 15000
  };

  try {
    const response = await rp(options);
    return response;
  } catch (error) {
    console.error('调用百度昆虫识别API失败:', error);
    throw new Error('识别服务异常');
  }
}

// 昆虫名称映射表 - 将大类映射到更具体的小类
const INSECT_NAME_MAP = {
  '锹甲': ['中华大扁锹', '巨扁锹甲', '两点赤锹甲', '台湾扁锹'],
  '锹形虫': ['中华大扁锹', '巨扁锹甲', '两点赤锹甲', '台湾扁锹'],
  '螳螂': ['中华大刀螳', '眼斑螳螂', '广斧螳螂', '枯叶螳螂'],
  '胡蜂': ['金环胡蜂', '黑尾胡蜂', '黄脚胡蜂', '墨胸胡蜂'],
  '熊蜂': ['红光熊蜂', '明亮熊蜂', '火红熊蜂', '乌苏里熊蜂'],
  '蜜蜂': ['中华蜜蜂', '意大利蜂', '东北黑蜂', '新疆黑蜂'],
  '蝴蝶': ['菜粉蝶', '凤蝶', '蛱蝶', '灰蝶'],
  '蜻蜓': ['豆娘', '黄蜻', '红蜻', '碧伟蜓'],
  '蚂蚁': ['红火蚁', '弓背蚁', '大头蚁', '铺道蚁'],
  '蟋蟀': ['油葫芦', '蛐蛐', '灶马蟋', '棺头蟋'],
  '蝗虫': ['东亚飞蝗', '中华稻蝗', '东亚飞蝗', '沙漠蝗'],
  '螽斯': ['蝈蝈', '纺织娘', '草螽', '露螽'],
  '甲虫': ['金龟子', '天牛', '象甲', '叶甲'],
  '瓢虫': ['七星瓢虫', '异色瓢虫', '龟纹瓢虫', '二十八星瓢虫'],
  '天牛': ['星天牛', '桑天牛', '光肩星天牛', '桃红颈天牛'],
  '金龟子': ['铜绿丽金龟', '苹毛丽金龟', '暗黑鳃金龟', '华北大黑鳃金龟'],
  '蝉': ['蚱蝉', '蟪蛄', '寒蝉', '鸣鸣蝉']
};

// 获取最可能的具体昆虫名称
getSpecificInsectName = (generalName, score) => {
  // 如果分数很高（>0.8），可以尝试返回更具体的名称
  if (score > 0.8 && INSECT_NAME_MAP[generalName]) {
    // 返回第一个可能的具体名称（实际应用中可以根据更多特征选择）
    return INSECT_NAME_MAP[generalName][0];
  }
  return generalName;
};

// 云函数入口函数
exports.main = async (event, context) => {
  const { imageBase64 } = event;
  
  if (!imageBase64) {
    return {
      success: false,
      message: '缺少图片数据',
      data: []
    };
  }
  
  try {
    const result = await recognizeInsect(imageBase64);
    
    if (!result || !result.result) {
      return {
        success: false,
        message: '识别服务返回数据异常',
        data: []
      };
    }
    
    // 只过滤掉非动物结果，允许所有动物识别结果通过
    const insectResults = result.result
      .filter(item => item.name !== '非动物' && item.score > 0.1)
      .map(item => ({
        name: getSpecificInsectName(item.name, item.score),
        originalName: item.name, // 保留原始识别名称
        score: item.score,
        scorePercent: Math.round(item.score * 100),
        category: item.baike_info ? item.baike_info.classname || '未知' : '未知',
        description: item.baike_info ? item.baike_info.description || '' : '',
        habitat: item.baike_info ? item.baike_info.place || '未知' : '未知',
        food: item.baike_info ? item.baike_info.food || '未知' : '未知',
        baike_info: item.baike_info || {}
      }));
    
    return {
      success: true,
      data: insectResults
    };
  } catch (error) {
    console.error('识别过程出错:', error);
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
};