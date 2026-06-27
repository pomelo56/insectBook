// cloudfunctions/calliNat/index.js - 昆虫识别云函数（简化版）
const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 配置
const CONFIG = {
  API_TIMEOUT: 6000,     // 减少到6秒，更快失败
  MAX_RETRIES: 1,        // 只重试1次
  RETRY_DELAY: 100,      // 减少延迟到100ms
  API_ENDPOINT: `${process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'}/chat/completions`,
  MODEL_ID: process.env.MODEL_ID || 'doubao-seed-1-6-vision-250815'
};

function log(msg) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
  console.log(`[${timestamp}] ${msg}`);
}

/**
 * HTTPS 请求
 */
function httpsRequest(url, options, data, timeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: options.headers,
      timeout: timeout,
      // 优化网络连接
      agent: new https.Agent({
        keepAlive: false,      // 禁用连接复用
        maxSockets: 1,
        timeout: timeout
      })
    };
    
    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('JSON解析失败'));
          }
        } else {
          const err = new Error(`HTTP ${res.statusCode}`);
          err.statusCode = res.statusCode;
          reject(err);
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const err = new Error('请求超时');
      err.code = 'ETIMEDOUT';
      reject(err);
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 主函数
 */
exports.main = async (event, context) => {
  const startTime = Date.now();
  log('=== 昆虫识别开始 ===');
  
  try {
    // 1. 获取图片
    const { imageBase64 } = event;
    if (!imageBase64) throw new Error('缺少图片数据');
    
    // 2. 处理图片
    let cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const imageSize = Buffer.from(cleanBase64, 'base64').length;
    log(`原始图片: ${Math.round(imageSize / 1024)}KB`);
    
    // 只在图片过大时轻微压缩（不截断，避免损坏）
    // 注：前端已经压缩过，这里不再处理
    log(`使用原图，保证识别质量`);
    
    // 3. 准备请求
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('配置错误: 无API_KEY - 密钥缺失');
    }
    log(`API Key: ${apiKey.substring(0, 8)}...`);
    
    // 优化的提示词 - 要求精确到种
    const prompt = '昆虫名称：';
    
    const requestBody = {
      model: CONFIG.MODEL_ID,
      messages: [{
        role: 'system',
        content: '你是昆虫识别专家。只回答昆虫的中文学名，精确到种（如中华大刀螳）。无法识别则回答“无法识别”。'
      }, {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { 
              url: `data:image/jpeg;base64,${cleanBase64}`,
              detail: 'low'  // 使用低清模式，更快处理
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }],
      temperature: 0.1,  // 降到最低，最确定
      max_tokens: 10,    // 减少到10
      top_p: 0.5
    };
    
    const postData = JSON.stringify(requestBody);
    log(`请求体: ${Math.round(postData.length / 1024)}KB`);
    
    // 4. 调用 API（带重试）
    let apiResponse = null;
    let lastError = null;
    
    for (let retry = 0; retry <= CONFIG.MAX_RETRIES; retry++) {
      try {
        log(`API调用 (第${retry + 1}次)`);
        
        const elapsed = Date.now() - startTime;
        const remaining = 18000 - elapsed;  // 云函数总超时20秒，留2秒余量
        
        // 如果剩余时间不足，直接放弃
        if (remaining < 2000) {  // 提前到2秒
          log(`剩余时间不足(${remaining}ms)，放弃调用`);
          throw new Error('时间不足');
        }
        
        const timeout = Math.min(CONFIG.API_TIMEOUT, remaining - 500);  // 留0.5秒余量
        log(`超时: ${timeout}ms (已用:${elapsed}ms 剩余:${remaining}ms)`);
        
        const options = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(postData),
            'Connection': 'close'  // 添加Connection: close
          }
        };
        
        apiResponse = await httpsRequest(CONFIG.API_ENDPOINT, options, postData, timeout);
        log('API调用成功');
        break;
        
      } catch (error) {
        lastError = error;
        log(`API失败: ${error.message}`);
        
        if (retry < CONFIG.MAX_RETRIES) {
          log(`${CONFIG.RETRY_DELAY}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        }
      }
    }
    
    if (!apiResponse) throw lastError || new Error('API调用失败');
    
    // 调试：记录完整API响应
    log(`完整API响应: ${JSON.stringify(apiResponse)}`);
    
    // 5. 处理结果
    const message = apiResponse.choices?.[0]?.message;
    if (!message || !message.content) {
      log('API返回为空');
      throw new Error('API返回数据为空');
    }
    
    let insectName = message.content.trim();
    log(`API返回: "${insectName}"`);
    
    // 清洗 - 更严格
    insectName = insectName
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')  // 移除所有标点
      .replace(/\(.+?\)/g, '')  // 移除括号内容
      .replace(/（.+?）/g, '')  // 移除中文括号内容
      .replace(/注.*/g, '')     // 移除"注"及之后的内容
      .replace(/若.*/g, '')     // 移除"若"及之后的内容
      .split(/\s+/)[0]         // 只取第一个词
      .trim();
    
    log(`清洗后: "${insectName}"`);
    
    // 再次检查长度
    if (insectName.length > 10) {
      // 如果还是太长，只取前面的中文部分
      const chineseMatch = insectName.match(/^[\u4e00-\u9fa5]{2,6}/);
      if (chineseMatch) {
        insectName = chineseMatch[0];
        log(`二次清洗: "${insectName}"`);
      }
    }
    
    // 判断 - 更严格
    const failKeywords = ['无法', '不能', '看不', '模糊', '不清', '未知', '识别', '推测', '注'];
    const hasFail = failKeywords.some(kw => insectName.includes(kw));
    const hasChinese = /[\u4e00-\u9fa5]{2,}/.test(insectName);
    const isLengthOk = insectName.length >= 2 && insectName.length <= 8;  // 长度限制2-8字
    const isValid = !hasFail && hasChinese && isLengthOk;
    
    log(`失败词:${hasFail} 中文:${hasChinese} 长度OK:${isLengthOk} 有效:${isValid}`);
    
    // 如果名称过长或包含奇怪内容，视为识别失败
    if (isValid && insectName.length > 6) {
      log(`名称过长(${insectName.length}字)，可能不准确`);
    }
    
    // 6. 返回
    const result = {
      isRecognized: isValid,
      insectName: isValid ? insectName : '未识别出昆虫',
      confidence: isValid ? 'high' : 'low',
      scorePercent: isValid ? '95' : '30',  // 添加具体的百分比
      category: '昆虫',  // 添加类别
      choices: apiResponse.choices || [],
      features: {},
      _debug: {
        original: message.content,
        cleaned: insectName,
        elapsed: Date.now() - startTime
      }
    };
    
    log(`=== 识别${isValid ? '成功' : '失败'} 耗时${result._debug.elapsed}ms ===`);
    return result;
    
  } catch (error) {
    log(`=== 错误: ${error.message} ===`);
    
    // 判断错误类型
    let errorType = error.code || 'unknown';
    let errorMessage = error.message;
    let suggestion = '';
    
    if (errorType === 'ETIMEDOUT') {
      errorMessage = '豆包API响应超时';
      suggestion = '网络或API服务繁忙，请稍后重试或手动输入昆虫名称。\n\n优化建议：\n1. 检查网络连接\n2. 稍后再试\n3. 手动输入昆虫名称';
      log('建议：1)稍后重试 2)检查网络 3)手动输入');
    } else if (errorType === 'ENOTFOUND') {
      errorMessage = 'DNS解析失败';
      suggestion = '网络连接异常，请检查网络设置';
    } else if (error.statusCode) {
      errorMessage = `API返回错误: HTTP ${error.statusCode}`;
      suggestion = '服务异常，请稍后重试';
    }
    
    return {
      isRecognized: false,
      insectName: '未识别出昆虫',
      confidence: 'low',
      scorePercent: '30',  // 失败时的置信度
      category: '未知',
      choices: [],
      features: {},
      error: {
        type: errorType,
        message: errorMessage,
        suggestion: suggestion,
        timestamp: new Date().toISOString()
      }
    };
  }
};
