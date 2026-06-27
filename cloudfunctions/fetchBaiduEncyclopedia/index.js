// 云函数：从百度百科获取昆虫信息
const cloud = require('wx-server-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  const startTime = Date.now();
  // 添加详细的调试日志
  console.log('===== 百度百科云函数开始执行 =====');
  console.log('执行环境信息:', {
    nodeVersion: process.version,
    memoryLimit: process.env.WX_RUNTIME_MEMORY,
    timeout: process.env.WX_RUNTIME_TIMEOUT
  });
  console.log('云函数接收到的完整参数:', JSON.stringify(event));
  console.log('云函数上下文:', {
    OPENID: context.OPENID,
    APPID: context.APPID,
    ENV: context.ENV
  });
  
  try {
    // 基本参数验证
    const { keyword } = event || {};
    console.log('原始关键词:', keyword);
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      console.error('参数验证失败：缺少有效的关键词');
      return {
        success: false,
        message: '缺少有效的关键词参数',
        code: 'INVALID_KEYWORD',
        debugInfo: { receivedKeyword: keyword }
      };
    }
    
    // 处理关键词
    const trimmedKeyword = keyword.trim();
    console.log('处理后的关键词:', trimmedKeyword);
    
    // 构建百度百科搜索URL
    const searchUrl = `https://baike.baidu.com/search/word?word=${encodeURIComponent(trimmedKeyword)}`;
    console.log('搜索URL:', searchUrl);
    
    // 设置请求配置
    const requestOptions = {
      timeout: 10000, // 10秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        'Referer': 'https://www.baidu.com/',
        'Connection': 'keep-alive'
      },
      maxRedirects: 5,
      responseType: 'text',
      // 允许重定向
      followRedirect: true
    };
    
    console.log('开始发送HTTP请求...');
    // 发送请求到百度百科
    let response = await axios.get(searchUrl, requestOptions);
    console.log('HTTP请求成功完成，状态码:', response.status);
    console.log('响应头信息:', Object.keys(response.headers));
    console.log('最终URL:', response.request.res.responseUrl);
    console.log('响应体大小:', response.data.length, '字符');
    
    // 检查是否是重定向到了具体百科页面
    const isDetailPage = response.request.res.responseUrl.includes('/item/');
    console.log('是否为详情页:', isDetailPage);
    
    // 检查响应数据
    if (!response.data || typeof response.data !== 'string' || response.data.length === 0) {
      throw new Error('无效的响应数据：响应体为空或格式错误');
    }
    
    // 记录页面开头部分以帮助调试
    const pagePreview = response.data.substring(0, 500);
    console.log('页面开头预览:', pagePreview);
    
    // 记录页面中的一些关键HTML结构信息
    console.log('开始检查HTML结构...');
    const bodyStartIndex = response.data.indexOf('<body');
    const bodyEndIndex = response.data.indexOf('</body>');
    console.log('Body标签位置:', { start: bodyStartIndex, end: bodyEndIndex });
    
    // 检查是否有特殊的HTML处理（如转义或混淆）
    if (response.data.includes('&lt;') || response.data.includes('&gt;')) {
      console.log('检测到HTML转义字符，可能需要处理');
    }
    
    console.log('开始解析HTML...');
    // 使用cheerio解析HTML
    // 添加decodeEntities选项以确保正确解析HTML实体
    const $ = cheerio.load(response.data, { decodeEntities: false });
    console.log('HTML解析完成，开始提取内容...');
    
    // 调试：输出页面中的一些基本结构信息
    console.log('页面标题:', $('title').text());
    console.log('Meta描述:', $('meta[name="description"]').attr('content'));
    console.log('页面中的div元素总数:', $('div').length);
    console.log('页面中的p元素总数:', $('p').length);
    
    // 获取页面中的前10个div元素的class和id，以帮助识别结构
    console.log('页面前10个div元素信息:');
    $('div').slice(0, 10).each((index, element) => {
      const div = $(element);
      console.log(`Div ${index}:`, { 
        class: div.attr('class') || '无class', 
        id: div.attr('id') || '无id',
        textLength: div.text().length 
      });
    });
    
    // 扩展选择器列表，增加百度百科可能使用的更多选择器
    const contentDivs = [
      { name: '.lemma-summary', found: false },      // 百度百科标准摘要区域
      { name: '.lemma-content', found: false },       // 百度百科内容区域
      { name: '#lemma-content', found: false },       // 可能的ID版本
      { name: '.main-content', found: false },        // 通用主内容区域
      { name: '#content-wrapper', found: false },     // 内容包装器
      { name: '.content-main', found: false },        // 主内容区域
      { name: '.abstract', found: false },            // 摘要区域
      { name: '.summary', found: false },             // 摘要区域
      { name: '.view', found: false },                // 查看区域
      { name: '#content', found: false },             // 内容主区域
      { name: '.content', found: false },             // 内容区域
      { name: '.article-content', found: false },     // 文章内容
      { name: '.entry-content', found: false },       // 条目内容
      { name: '.basic-info', found: false },          // 基本信息区域
      { name: '.content-container', found: false }    // 内容容器
    ];
    
    let content = '';
    
    // 策略1: 尝试从不同的DOM元素获取内容
    console.log('策略1: 尝试从标准百科选择器获取内容');
    for (const selector of contentDivs) {
      const elements = $(selector.name);
      selector.found = elements.length > 0;
      console.log(`选择器 ${selector.name} 找到 ${elements.length} 个元素`);
      
      if (elements.length > 0) {
        // 提取文本内容
        content = elements.text().trim();
        console.log(`从 ${selector.name} 提取到内容，长度:`, content.length);
        console.log(`内容预览:`, content.substring(0, 100) + (content.length > 100 ? '...' : ''));
        
        // 过滤版权信息
        if (content.includes('使用百度前必读')) {
          content = content.replace(/©.*?使用百度前必读.*?京公网安备.*?号/g, '').trim();
          console.log('移除版权信息后内容长度:', content.length);
        }
        
        // 如果内容足够长，就使用它
        if (content.length > 100) {
          break;
        }
      }
    }
    
    // 策略2: 尝试直接从页面的meta description中提取内容（这通常包含百科摘要）
    if (content.length < 100) {
      console.log('策略2: 尝试从meta description提取内容');
      const metaDescription = $('meta[name="description"]').attr('content');
      if (metaDescription && metaDescription.length > 50) {
        console.log('从meta description提取到内容，长度:', metaDescription.length);
        content = metaDescription;
      }
    }
    
    // 策略3: 尝试从搜索结果页面提取第一个结果链接
    if (content.length < 100 && !isDetailPage) {
      console.log('策略3: 尝试从搜索结果页面提取第一个百科链接');
      const firstResultLink = $('.result-list .result a').first().attr('href');
      
      if (firstResultLink) {
        console.log('找到第一个搜索结果链接:', firstResultLink);
        
        // 构建完整URL
        const detailUrl = firstResultLink.startsWith('http') ? firstResultLink : `https://baike.baidu.com${firstResultLink}`;
        console.log('获取详情页URL:', detailUrl);
        
        try {
          // 请求详情页
          const detailResponse = await axios.get(detailUrl, requestOptions);
          console.log('详情页请求成功，状态码:', detailResponse.status);
          
          // 重新解析详情页
          const detail$ = cheerio.load(detailResponse.data, { decodeEntities: false });
          
          // 再次尝试提取内容
          for (const selector of contentDivs) {
            const elements = detail$(selector.name);
            console.log(`详情页选择器 ${selector.name} 找到 ${elements.length} 个元素`);
            
            if (elements.length > 0) {
              content = elements.text().trim();
              console.log(`从详情页 ${selector.name} 提取到内容，长度:`, content.length);
              
              // 过滤版权信息
              if (content.includes('使用百度前必读')) {
                content = content.replace(/©.*?使用百度前必读.*?京公网安备.*?号/g, '').trim();
                console.log('移除版权信息后内容长度:', content.length);
              }
              
              if (content.length > 100) {
                break;
              }
            }
          }
        } catch (error) {
          console.error('请求详情页失败:', error.message);
        }
      }
    }
    
    // 策略4: 尝试提取所有p标签内容
    if (content.length < 100) {
      console.log('策略4: 尝试提取所有p标签内容');
      const paragraphs = [];
      $('p').each((index, element) => {
        const text = $(element).text().trim();
        // 过滤掉版权信息和太短的段落
        if (text && text.length > 15 && !text.includes('使用百度前必读') && !text.includes('京公网安备')) {
          paragraphs.push(text);
        }
      });
      
      console.log('找到', paragraphs.length, '个有效段落');
      content = paragraphs.join('\n\n').trim();
      if (content.length > 0) {
        console.log('p标签内容预览:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
      }
    }
    
    // 策略5: 尝试从页面中提取正文文本（使用更广泛的选择器）
    if (content.length < 100) {
      console.log('策略5: 尝试从页面中提取正文文本');
      const bodyContent = [];
      
      // 尝试获取页面中的主要文本内容
      $('div, section, article').each((index, element) => {
        const div = $(element);
        const text = div.text().trim();
        // 过滤掉太短的内容和版权信息
        if (text && text.length > 100 && !text.includes('使用百度前必读')) {
          // 检查是否包含实际内容（排除脚本、样式等）
          if (text.replace(/\s+/g, ' ').length > 100) {
            bodyContent.push(text);
            // 找到足够长的内容就停止
            if (bodyContent.join('\n\n').length > 500) {
              return false; // 跳出each循环
            }
          }
        }
      });
      
      if (bodyContent.length > 0) {
        content = bodyContent.join('\n\n').trim();
        console.log('从页面提取到文本内容，长度:', content.length);
        console.log('内容预览:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
      }
    }
    
    // 策略6: 尝试从页面标题和meta标签组合信息
    if (content.length < 100) {
      console.log('策略6: 尝试从页面标题和meta标签组合信息');
      const pageTitle = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      if (pageTitle && metaDescription) {
        content = `${pageTitle}\n\n${metaDescription}`;
        console.log('从标题和meta组合内容，长度:', content.length);
      }
    }
    
    // 策略7: 作为最后的手段，尝试从HTML文本中直接提取内容（绕过cheerio可能的解析问题）
    if (content.length < 100) {
      console.log('策略7: 尝试直接从HTML文本中提取内容');
      // 尝试提取页面中的文本内容，过滤掉HTML标签和版权信息
      const plainText = response.data
        .replace(/<script[^>]*>.*?<\/script>/gs, '') // 移除脚本
        .replace(/<style[^>]*>.*?<\/style>/gs, '')   // 移除样式
        .replace(/<[^>]+>/g, ' ')                     // 移除所有HTML标签
        .replace(/&[^;]+;/g, ' ')                     // 移除HTML实体
        .replace(/\s+/g, ' ')                         // 合并空白字符
        .replace(/©.*?使用百度前必读.*?京公网安备.*?号/g, '') // 移除版权信息
        .trim();
      
      // 提取前500个字符作为内容
      content = plainText.substring(0, 1000).trim();
      console.log('直接从HTML提取文本内容，长度:', content.length);
    }
    
    console.log('最终提取的内容长度:', content.length);
    
    // 进一步清理内容
    content = content.replace(/\s+/g, ' ').replace(/\s*\n\s*/g, '\n\n').trim();
    
    // 过滤掉常见的无关内容
    const unwantedPatterns = [
      /©.*?使用百度前必读.*?京公网安备.*?号/g,
      /百科协议|隐私政策|合作平台|ICP证/g,
      /编辑|锁定|百科|词条/g,
      /https?:\/\/[^\s]+/g,
      /\d+年\d+月\d+日/g,
      /[【\[][^【\[\]】]*[】\]]/g
    ];
    
    unwantedPatterns.forEach(pattern => {
      content = content.replace(pattern, '').trim();
    });
    
    console.log('清理后内容长度:', content.length);
    console.log('内容预览:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    
    // 内容处理
    if (!content || content.length < 50) {
      console.warn('提取的百科信息内容过少或无效');
      
      // 如果无法获取真实内容，返回基于模拟数据的提示
      return {
        success: true,
        content: `关于"${trimmedKeyword}"的详细信息暂时无法获取。请尝试使用其他关键词或稍后再试。`,
        keyword: trimmedKeyword,
        isMockData: true,
        timestamp: Date.now(),
        debugInfo: {
          message: '无法从百度百科获取有效内容',
          keyword: trimmedKeyword,
          extractedLength: content ? content.length : 0,
          selectorsStatus: contentDivs,
          executionTime: Date.now() - startTime
        }
      };
    }
    
    // 限制内容长度
    if (content.length > 5000) {
      console.log('内容过长，进行截断');
      content = content.substring(0, 5000) + '...';
    }
    
    console.log('内容处理完成，准备返回结果');
    // 返回成功结果
    return {
      success: true,
      content: content,
      keyword: trimmedKeyword,
      isMockData: false,
      timestamp: Date.now(),
      debugInfo: {
        contentLength: content.length,
        responseStatus: response.status,
        isDetailPage: isDetailPage,
        finalUrl: response.request.res.responseUrl,
        executionTime: Date.now() - startTime
      }
    };
    
  } catch (error) {
    // 详细记录错误信息
    console.error('===== 云函数执行异常 =====');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    if (error.code) console.error('错误代码:', error.code);
    if (error.response) {
      console.error('HTTP响应错误:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: Object.keys(error.response.headers)
      });
    }
    if (error.stack) console.error('错误堆栈:', error.stack);
    
    // 根据不同错误类型提供更具体的提示
    let errorMessage = '获取百科信息失败';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = '请求百度百科超时';
      errorCode = 'TIMEOUT';
    } else if (error.response) {
      errorMessage = `百度百科返回错误，状态码: ${error.response.status}`;
      errorCode = `HTTP_${error.response.status}`;
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      errorMessage = '网络连接问题，无法访问百度百科';
      errorCode = 'NETWORK_ERROR';
    }
    
    // 返回错误信息
    return {
      success: false,
      message: errorMessage,
      error: error.message || String(error),
      code: errorCode,
      errorType: error.constructor.name,
      timestamp: Date.now(),
      debugInfo: {
        originalError: error.message,
        errorCode: error.code,
        hasResponse: !!error.response
      }
    };
  } finally {
    console.log('===== 百度百科云函数执行结束 =====');
  }
};