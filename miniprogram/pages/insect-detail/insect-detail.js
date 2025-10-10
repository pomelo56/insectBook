// pages/insect-detail/insect-detail.js
const app = getApp();

// 昆虫名称标准化映射（解决同种昆虫不同名称的问题）
const INSECT_NAME_MAP = {
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
  '蠼螋': '蠼螋',
  '蜈蚣': '蜈蚣'
};

// 标准化昆虫名称
function normalizeInsectName(name) {
  return INSECT_NAME_MAP[name] || name;
}

// 生成统一的昆虫ID
function generateInsectId(name) {
  const normalizedName = normalizeInsectName(name);
  // 使用标准化名称生成ID，避免同种昆虫不同ID
  return normalizedName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
}

Page({
  data: {
    insectId: '',
    insectInfo: null,
    baikeContent: '',
    loading: true,
    error: '',
    longitude: '',
    latitude: ''
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        insectId: options.id
      });
      
      // 存储从上个页面传来的图片URL（如果有）
      this.passedImageUrl = options.imageUrl ? decodeURIComponent(options.imageUrl) : '';
      
      // 确保在获取到openid后再加载数据
      this.waitForOpenidAndLoadData();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  // 等待openid获取完成后再加载数据
  waitForOpenidAndLoadData: function() {
    const app = getApp();
    // 同时获取用户位置信息
    this.getUserLocation();
    
    if (app.globalData.openid) {
      // 如果已经有openid，直接加载数据
      this.loadInsectDetail();
    } else {
      // 如果还没有openid，设置一个定时器轮询检查
      console.log('等待获取openid...');
      const timer = setInterval(() => {
        if (app.globalData.openid) {
          clearInterval(timer);
          console.log('获取到openid，开始加载数据');
          this.loadInsectDetail();
        } else {
          // 检查是否超过了最大等待时间（5秒）
          if (!this.startWaitTime) {
            this.startWaitTime = Date.now();
          } else if (Date.now() - this.startWaitTime > 5000) {
            clearInterval(timer);
            console.warn('超时未获取到openid，使用默认数据');
            this.loadInsectDetail(); // 即使没有openid，也继续加载，使用默认值
          }
        }
      }, 100); // 每100ms检查一次
    }
  },

  // 获取用户位置
  getUserLocation: function() {
    const that = this;
    
    // 先检查位置权限
    wx.getSetting({
      success: function(res) {
        if (!res.authSetting['scope.userLocation']) {
          // 未授权，请求授权
          wx.authorize({
            scope: 'scope.userLocation',
            success: function() {
              // 授权成功后获取位置
              that.getLocationWithRetry(0);
            },
            fail: function() {
              // 授权失败，使用默认值
              console.log('位置授权失败，使用默认值');
            }
          });
        } else {
          // 已授权，直接获取位置
          that.getLocationWithRetry(0);
        }
      }
    });
  },
  
  // 带重试机制的位置获取
  getLocationWithRetry: function(retryCount) {
    const that = this;
    const maxRetries = 2;
    
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
      },
      fail: function(err) {
        console.error('获取位置失败:', err);
        if (retryCount < maxRetries) {
          // 重试获取位置
          setTimeout(function() {
            that.getLocationWithRetry(retryCount + 1);
          }, 1000);
        } else {
          console.log('多次获取位置失败，使用默认值');
        }
      }
    });
  },
  
  // 加载昆虫详情 - 修改为返回Promise以便下拉刷新正常工作
  loadInsectDetail: function() {
    return new Promise((resolve, reject) => {
      const app = getApp(); // 重新获取app实例，确保拿到最新的globalData
      console.log('开始加载昆虫详情，昆虫ID:', this.data.insectId, '当前openid:', app.globalData.openid);
      
      try {
        // 尝试从本地缓存获取数据
        const cacheKey = `insect_detail_${this.data.insectId}`;
        const cachedData = wx.getStorageSync(cacheKey);
        const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 缓存有效期7天
        
        if (cachedData && cachedData.timestamp) {
          // 检查缓存是否过期
          const now = Date.now();
          // 修复：将const改为let，以便可以修改值
          let isCacheValid = (now - cachedData.timestamp) < CACHE_EXPIRE_TIME;
          
          // 重要修复：如果页面是从相机页面跳转过来的（通常意味着刚刚添加/更新了昆虫记录）
          // 则强制从云端获取最新数据，不使用缓存
          const fromCameraPage = app.globalData.fromCameraPage || false;
          if (fromCameraPage) {
            console.log('检测到从相机页面跳转过来，强制从云端获取最新数据，不使用缓存');
            isCacheValid = false;
            app.globalData.fromCameraPage = false; // 重置标记
          }
          
          console.log('从本地缓存获取到昆虫详情，缓存状态:', isCacheValid ? '有效' : '已过期');
          
          // 无论缓存是否过期，都先使用缓存数据显示页面
          this.setData({
            insectInfo: cachedData.insectInfo,
            baikeContent: cachedData.baikeContent,
            loading: false
          }, () => {
            // 从缓存加载数据时记录日志
            this.logInsectDetail(cachedData.insectInfo);
          });
          
          // 重要优化：
          // 1. 非下拉刷新模式且缓存有效：优先使用缓存数据，避免覆盖用户刚编辑的内容
          // 2. 下拉刷新模式或缓存无效：从云端获取最新数据
          if (this.isPullingDownRefresh || !isCacheValid) {
            console.log('下拉刷新模式或缓存无效：从云端获取最新数据');
            this.updateInsectDetailFromCloud().then(resolve).catch(reject);
          } else {
            console.log('非下拉刷新模式且缓存有效：优先使用缓存数据，确保用户编辑内容不被覆盖');
            resolve();
          }
          return;
        }
      } catch (e) {
        console.error('读取缓存失败:', e);
      }
      
      // 缓存不存在或读取失败，从云端获取
      this.updateInsectDetailFromCloud().then(resolve).catch(reject);
    });
  },
  
  // 从云端更新昆虫详情 - 修改为返回Promise
  updateInsectDetailFromCloud: function() {
    return new Promise((resolve, reject) => {
      // 避免重复更新
      if (this.isUpdating) {
        console.log('正在更新中，跳过重复请求');
        resolve();
        return;
      }
      this.isUpdating = true;
      
      const db = wx.cloud.database();
      const app = getApp();
    
      // 首先从本地数据库获取昆虫基本信息
      // 声明变量存储昆虫信息
      let insectInfo;
      
      db.collection('insects')
        .doc(this.data.insectId)
        .get()
        .then(res => {
          console.log('获取昆虫基本信息成功:', res.data);
          insectInfo = res.data;
          
          // 优先使用从首页传递过来的图片URL（如果有）
          if (this.passedImageUrl) {
            console.log('[图片调试] 优先使用从首页传递的图片URL:', this.passedImageUrl);
            insectInfo.imageUrl = this.passedImageUrl;
          } else {
            console.log('[图片调试] 没有从首页传递的图片URL，使用默认逻辑');
          }
          
          return Promise.resolve();
        })
        .catch(error => {
          console.log('获取昆虫基本信息失败:', error);
          // 创建默认昆虫信息，确保页面能正常显示
          insectInfo = {
            name: '未知昆虫',
            description: '这是一个尚未收录的昆虫品种。',
            imageUrl: '/images/default_insect.png',
            habitat: '未知',
            food: '未知',
            characteristics: '未知'
          };
          
          // 优先使用从首页传递过来的图片URL（如果有）
          if (this.passedImageUrl) {
            console.log('[图片调试] 优先使用从首页传递的图片URL:', this.passedImageUrl);
            insectInfo.imageUrl = this.passedImageUrl;
          } else {
            console.log('[图片调试] 没有从首页传递的图片URL，使用默认逻辑');
          }
          
          return Promise.resolve();
        })
        .then(() => {
          // 昆虫预设图片URL映射表 - 使用更稳定的图片源
        const insectImageUrls = {
        '眼斑螳螂': 'https://img.alicdn.com/imgextra/i4/O1CN01aZxGmz1e0XyF5YjH3_!!6000000003688-0-lubanu.jpg',
        '红珠凤蝶蛹': 'https://t7.baidu.com/it/u=228423286,3138567427&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
        '步甲幼虫': 'https://img.alicdn.com/imgextra/i1/O1CN014mK94O1fXsUq3z8bW_!!6000000003510-0-lubanu.jpg',
        '地鳖': 'https://img.alicdn.com/imgextra/i4/O1CN01z72Fg21j6gZt73zPm_!!6000000004386-0-lubanu.jpg',
        '蝴蝶': 'https://img.alicdn.com/imgextra/i2/O1CN01Kq1tVr1L2D4cVqGqT_!!6000000001025-0-lubanu.jpg',
        '蜜蜂': 'https://img.alicdn.com/imgextra/i1/O1CN01uD6bX71B1o5W5v5y0_!!6000000000191-0-lubanu.jpg',
        '蚂蚁': 'https://img.alicdn.com/imgextra/i4/O1CN010B2d0n1Rq9FkXhN6c_!!6000000002379-0-lubanu.jpg',
        '蜻蜓': 'https://img.alicdn.com/imgextra/i2/O1CN01Gz5h9q1Wk9WxJ7G1t_!!6000000002968-0-lubanu.jpg',
        '变色树蜥': 'https://img.alicdn.com/imgextra/i4/O1CN01Vg02Vd1T7oHf0t6w9_!!6000000003693-0-lubanu.jpg',
        '牡丹鹦鹉': 'https://img.alicdn.com/imgextra/i3/O1CN01ZkX2Xv1lZqLw7g67X_!!6000000004948-0-lubanu.jpg',
        '幽灵螳螂': 'https://img.alicdn.com/imgextra/i3/O1CN0189y3p21wYd9Z3eZfF_!!6000000006304-0-lubanu.jpg',
        '蓝舌石龙子': 'https://img.alicdn.com/imgextra/i4/O1CN01rNnY6G1WfC1l038jZ_!!6000000002910-0-lubanu.jpg',
        '中华大扁锹': 'https://img.alicdn.com/imgextra/i1/O1CN01hV5x8z1rZ10bJ4n2f_!!6000000006163-0-lubanu.jpg',
        '蓝孔雀': 'https://img.alicdn.com/imgextra/i2/O1CN01lI3jBm1tFm4aG1JkZ_!!6000000005907-0-lubanu.jpg',
        '姬兜': 'https://img.alicdn.com/imgextra/i4/O1CN01h1r3F51lB1nYl1e0X_!!6000000003687-0-lubanu.jpg',
          '苏里南潜螈': 'https://img.alicdn.com/imgextra/i2/O1CN01pO5w1j1eQvC6h5a2K_!!6000000002823-0-lubanu.jpg',
          '苏里南潜蠊': 'https://img.alicdn.com/imgextra/i2/O1CN01pO5w1j1eQvC6h5a2K_!!6000000002823-0-lubanu.jpg', // 添加苏里南潜蠊的图片URL
          '锹甲': 'https://img.alicdn.com/imgextra/i3/O1CN01dI9Z0G1y1j5v5n5rF_!!6000000006098-0-lubanu.jpg',
          '独角仙': 'https://img.alicdn.com/imgextra/i2/O1CN01E5P1dT1L0R6q3w2XQ_!!6000000001071-0-lubanu.jpg',
          '金龟子': 'https://img.alicdn.com/imgextra/i2/O1CN01Jv8V9h1nT9Q5h2Q5F_!!6000000005109-0-lubanu.jpg',
          '七星瓢虫': 'https://img.alicdn.com/imgextra/i3/O1CN018zR3m21o3X2c3m5fQ_!!6000000005090-0-lubanu.jpg',
          '竹节虫': 'https://img.alicdn.com/imgextra/i3/O1CN01qF0b3P1X8h1M6a3p9_!!6000000003618-0-lubanu.jpg',
          '大刀螳螂': 'https://img.alicdn.com/imgextra/i2/O1CN01j6c3WJ1b4K5h5z4Xf_!!6000000002719-0-lubanu.jpg',
          '蓝闪蝶': 'https://img.alicdn.com/imgextra/i4/O1CN01r4QnHh1l9v2a3e6j5_!!6000000004776-0-lubanu.jpg'
        };
        
        console.log('[图片调试] 当前昆虫名称:', insectInfo.name, '当前图片URL:', insectInfo.imageUrl);
        
        // 检查并更新图片URL - 只有在没有从首页传递图片URL时才执行
        if (!this.passedImageUrl) {
          if (insectImageUrls[insectInfo.name]) {
            console.log('[图片调试] 为', insectInfo.name, '找到预设图片URL:', insectImageUrls[insectInfo.name]);
            insectInfo.imageUrl = insectImageUrls[insectInfo.name];
          } else {
            console.log('[图片调试] 未找到预设图片URL，使用灰态LOGO:', insectInfo.imageUrl || '/images/empty_insect.png');
            insectInfo.imageUrl = insectInfo.imageUrl || '/images/empty_insect.png';
          }
        } else {
          console.log('[图片调试] 保留从首页传递的图片URL，不执行默认更新逻辑');
        }
        
        // 确保有默认图片 - 增强版本，不区分大小写
        // 只有在没有从首页传递图片URL时才执行这部分逻辑
        if (!this.passedImageUrl) {
          if (!insectInfo.imageUrl || insectInfo.imageUrl === '' || insectInfo.imageUrl === '/images/empty_insect.png') {
            console.log('昆虫图片URL为空或为默认图片，尝试使用预设图片URL');
            // 优先使用预设的图片URL，不区分大小写
            let foundImage = false;
            const insectNameLower = insectInfo.name.toLowerCase();
            
            // 遍历映射表查找匹配项
            for (const [key, value] of Object.entries(insectImageUrls)) {
              if (key.toLowerCase() === insectNameLower) {
                insectInfo.imageUrl = value;
                foundImage = true;
                break;
              }
            }
            
            if (foundImage) {
              console.log('使用预设图片URL:', insectInfo.imageUrl);
            } else {
              // 使用本地默认图片
              insectInfo.imageUrl = '/images/default_insect.png';
              console.log('使用默认图片');
            }
          } else {
            // 验证图片URL是否有效，如果无效则尝试使用预设图片或默认图片
            try {
              // 简单检查URL格式，避免new URL导致的问题
              if (insectInfo.imageUrl.startsWith('http') || insectInfo.imageUrl.startsWith('/')) {
                console.log('昆虫图片URL有效:', insectInfo.imageUrl);
              } else {
                console.log('昆虫图片URL格式不正确');
                throw new Error('URL格式不正确');
              }
            } catch (e) {
              console.log('昆虫图片URL无效，尝试使用预设图片URL:', e.message);
              // 不区分大小写查找预设图片
              let foundImage = false;
              const insectNameLower = insectInfo.name.toLowerCase();
              
              for (const [key, value] of Object.entries(insectImageUrls)) {
                if (key.toLowerCase() === insectNameLower) {
                  insectInfo.imageUrl = value;
                  foundImage = true;
                  break;
                }
              }
              
              if (foundImage) {
                console.log('使用预设图片URL:', insectInfo.imageUrl);
              } else {
                insectInfo.imageUrl = '/images/empty_insect.png';
                console.log('使用灰态LOGO');
              }
            }
          }
        } else {
          console.log('[图片调试] 有从首页传递的图片URL，跳过默认图片设置逻辑');
        }
        
        // 再次确认图片URL已正确设置
        // 优先使用用户自己拍摄的图片（如果有）
        // 增强版本：确保始终优先使用用户识别时的图片
        if (insectInfo.userImageUrl) {
          console.log('[图片优先级] 最终确认使用用户自己拍摄的图片:', insectInfo.userImageUrl);
          insectInfo.displayImageUrl = insectInfo.userImageUrl;
        } else if (this.passedImageUrl) {
          console.log('[图片优先级] 使用从首页传递的图片:', this.passedImageUrl);
          insectInfo.displayImageUrl = this.passedImageUrl;
        } else {
          console.log('[图片优先级] 最终确认使用标准图片:', insectInfo.imageUrl);
          insectInfo.displayImageUrl = insectInfo.imageUrl;
        }
        console.log('最终设置的显示图片URL:', insectInfo.displayImageUrl);
        
        // 然后从user_insects表获取发现次数和最近发现时间
          // 首先检查app.globalData.openid是否存在
          if (!app.globalData.openid) {
            // 如果没有openid，使用默认值
            insectInfo.foundCount = 0;
            insectInfo.lastFoundTime = '';
            
            this.setData({
              insectInfo: insectInfo
            });
            
            // 然后尝试从百度百科获取详细内容
    this.fetchBaiduBaikeContent(insectInfo.name);
    
    // 缓存昆虫基本信息
    this.cacheInsectData(insectInfo, ''); // 百科内容会在fetchBaiduBaikeContent后更新
    
    // 数据设置完成，resolve Promise
    resolve();
          } else {
            console.log('用户openid存在:', app.globalData.openid);
            // 获取标准化名称和统一ID，与markFound云函数保持一致
            const normalizedName = normalizeInsectName(insectInfo.name);
            const unifiedInsectId = generateInsectId(normalizedName);
            console.log('标准化名称:', normalizedName, '统一ID:', unifiedInsectId);
            
            // 首先尝试使用统一ID查询
            return db.collection('user_insects')
              .where({
                _openid: app.globalData.openid,
                insectId: unifiedInsectId
              })
              .orderBy('lastFoundTime', 'desc')
              .limit(1)
              .get()
             .then(userInsectRes => {
                console.log('统一ID查询结果:', userInsectRes.data);
                // 如果统一ID查询不到，尝试使用页面传入的原始ID查询
                if (userInsectRes.data.length === 0 && this.data.insectId !== unifiedInsectId) {
                  console.log('统一ID查询不到，尝试使用原始ID查询:', this.data.insectId);
                  return db.collection('user_insects')
                    .where({
                      _openid: app.globalData.openid,
                      insectId: this.data.insectId
                    })
                    .orderBy('lastFoundTime', 'desc')
                    .limit(1)
                    .get();
                }
                return userInsectRes;
              })              
              .then(userInsectRes => {
                console.log('最终用户昆虫记录查询结果:', userInsectRes.data);
                // 获取本地缓存数据，用于比较
                const cacheKey = `insect_detail_${this.data.insectId}`;
                const localCache = wx.getStorageSync(cacheKey);
                const hasValidLocalCache = localCache && (Date.now() - localCache.timestamp < 7 * 24 * 60 * 60 * 1000);
                
                if (userInsectRes.data.length > 0) {
                  const userInsect = userInsectRes.data[0];
                  
                  // 优先使用用户自己拍摄的图片
                  if (userInsect.userImageUrl) {
                    console.log('[图片优先级] 使用用户自己拍摄的图片:', userInsect.userImageUrl);
                    insectInfo.userImageUrl = userInsect.userImageUrl;
                  } else {
                    console.log('[图片优先级] 没有用户自己拍摄的图片，使用其他图片');
                  }
                  
                  // 重要修复：下拉刷新模式下，始终使用云端最新数据，不使用本地缓存
                  // 避免删除后重新添加昆虫时发现次数仍从本地缓存获取
                  if (this.isPullingDownRefresh) {
                    console.log('下拉刷新模式：强制使用云端最新数据，不使用本地缓存');
                    // 正常模式和下拉刷新模式都使用云端数据
                    insectInfo.foundCount = userInsect.foundCount || 0;
                    insectInfo.notes = userInsect.notes || '';
                    insectInfo.notesList = userInsect.notesList || [];
                  } else if (hasValidLocalCache && localCache.insectInfo) {
                    console.log('非下拉刷新模式：优先使用本地缓存的发现次数和笔记');
                    // 仅在非下拉刷新模式下使用本地缓存
                    insectInfo.foundCount = localCache.insectInfo.foundCount || userInsect.foundCount || 0;
                    insectInfo.notes = localCache.insectInfo.notes || userInsect.notes || '';
                    insectInfo.notesList = localCache.insectInfo.notesList || userInsect.notesList || [];
                  } else {
                    // 正常模式：使用云端数据
                    insectInfo.foundCount = userInsect.foundCount || 0;
                    insectInfo.notes = userInsect.notes || '';
                    insectInfo.notesList = userInsect.notesList || [];
                  }
                  console.log('发现次数:', insectInfo.foundCount);
                  // 确保lastFoundTime是一个有效的日期字符串
                  if (userInsect.lastFoundTime) {
                    console.log('原始lastFoundTime:', userInsect.lastFoundTime, '类型:', typeof userInsect.lastFoundTime);
                    // 处理数据库返回的Date对象或字符串格式
                    if (userInsect.lastFoundTime instanceof Date) {
                      insectInfo.lastFoundTime = userInsect.lastFoundTime.toISOString();
                    } else if (typeof userInsect.lastFoundTime === 'object' && userInsect.lastFoundTime._seconds) {
                      // 处理云数据库的Timestamp格式
                      insectInfo.lastFoundTime = new Date(userInsect.lastFoundTime._seconds * 1000).toISOString();
                    } else {
                      // 确保是字符串格式并尝试解析为日期
                      const timeStr = String(userInsect.lastFoundTime);
                      try {
                        // 尝试将各种可能的日期格式转换为ISO字符串
                        const date = new Date(timeStr);
                        if (!isNaN(date.getTime())) {
                          insectInfo.lastFoundTime = date.toISOString();
                        } else {
                          // 如果不是有效的日期，直接使用原始字符串
                          insectInfo.lastFoundTime = timeStr;
                        }
                      } catch (e) {
                        insectInfo.lastFoundTime = timeStr;
                      }
                    }
                    console.log('处理后的lastFoundTime:', insectInfo.lastFoundTime, '类型:', typeof insectInfo.lastFoundTime);
                    // 确保lastFoundTime是字符串格式
                    if (typeof insectInfo.lastFoundTime !== 'string') {
                      insectInfo.lastFoundTime = String(insectInfo.lastFoundTime);
                      console.log('转换为字符串后的lastFoundTime:', insectInfo.lastFoundTime);
                    }
                  } else {
                    insectInfo.lastFoundTime = '';
                    console.log('没有找到lastFoundTime，使用空字符串');
                  }
                  
                  // 在JavaScript中预先处理日期格式，而不是在WXML中处理
                  if (insectInfo.lastFoundTime) {
                    try {
                      // 无论什么格式，先创建Date对象
                      const date = new Date(insectInfo.lastFoundTime);
                      if (!isNaN(date.getTime())) {
                        // 格式化日期为YYYY-MM-DD格式
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        insectInfo.lastFoundDate = `${year}-${month}-${day}`;
                        console.log('格式化后的日期:', insectInfo.lastFoundDate);
                      } else {
                        insectInfo.lastFoundDate = insectInfo.lastFoundTime;
                      }
                    } catch (e) {
                      console.error('格式化日期失败:', e);
                      insectInfo.lastFoundDate = insectInfo.lastFoundTime;
                    }
                  } else {
                    insectInfo.lastFoundDate = '';
                  }
                } else {
                  // 尝试从另一个可能的集合获取，或者使用默认值
                  insectInfo.foundCount = 0;
                  insectInfo.lastFoundTime = '';
                  console.log('没有找到用户昆虫记录，使用默认值');
                }
                
                // 添加模拟的观察笔记数据，用于测试显示效果
                if (!insectInfo.notes) {
                  // 如果没有笔记，添加模拟数据
                  insectInfo.notes = '这是一条测试观察笔记。在这里可以记录你发现昆虫时的环境、行为和特征等信息。';
                  const currentDate = new Date();
                  const year = currentDate.getFullYear();
                  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                  const day = String(currentDate.getDate()).padStart(2, '0');
                  insectInfo.notesList = [
                    {
                      id: 'note_' + Date.now(),
                      content: '这是一条测试观察笔记。在这里可以记录你发现昆虫时的环境、行为和特征等信息。',
                      date: insectInfo.lastFoundDate || `${year}-${month}-${day}`,
                      time: '14:30',
                      weather: 'sunny',
                      season: 'summer',
                      rare: false,
                      createTime: new Date().toISOString()
                    }
                  ];
                }
                
                this.setData({
                  insectInfo: insectInfo
                }, () => {
                  // setData回调函数，确保数据已设置完成
                  console.log('数据设置完成回调 - insectInfo:', this.data.insectInfo);
                  console.log('数据设置完成回调 - lastFoundTime:', this.data.insectInfo.lastFoundTime, '类型:', typeof this.data.insectInfo.lastFoundTime);
                  if (this.data.insectInfo.lastFoundTime) {
                    console.log('lastFoundTime包含T:', this.data.insectInfo.lastFoundTime.includes('T'));
                  }
                  
                  // 记录昆虫详情查看日志
                  this.logInsectDetail(insectInfo);
                });
                console.log('设置页面数据成功:', this.data.insectInfo);
                
                // 然后尝试从百度百科获取详细内容
                this.fetchBaiduBaikeContent(insectInfo.name);
                
                // 数据设置完成，重置更新标记并resolve Promise
                  this.isUpdating = false;
                  resolve();
                })
              .catch(userInsectError => {
                console.error('查询用户昆虫记录失败:', userInsectError);
                // 即使查询失败，也要确保设置默认值并继续显示页面
                insectInfo.foundCount = 0;
                insectInfo.lastFoundTime = '';
                
                this.isUpdating = false; // 重置更新标记
                
                this.setData({
                  insectInfo: insectInfo
                });
                
                // 继续获取百度百科内容
                this.fetchBaiduBaikeContent(insectInfo.name);
                
                // 数据设置完成，resolve Promise
                resolve();
              });
        }
      })
      .catch(err => {
        console.error('获取昆虫信息失败:', err);
        this.isUpdating = false; // 重置更新标记
        
        // 尝试从本地缓存获取数据
        let insectInfo = null;
        const cacheKey = `insect_detail_${this.data.insectId}`;
        
        try {
          const localCache = wx.getStorageSync(cacheKey);
          if (localCache && localCache.insectInfo) {
            console.log('从本地缓存恢复昆虫数据');
            insectInfo = localCache.insectInfo;
          }
        } catch (e) {
          console.error('读取本地缓存失败:', e);
        }
        
        // 如果没有缓存数据，使用默认值
        if (!insectInfo) {
          insectInfo = {
            id: this.data.insectId,
            name: '未知昆虫',
            description: '这是一个尚未收录的昆虫品种。',
            imageUrl: '/images/default_insect.png',
            habitat: '未知',
            food: '未知',
            characteristics: '未知',
            foundCount: 0,
            lastFoundTime: '',
            lastFoundDate: '',
            displayImageUrl: '/images/default_insect.png'
          };
          
          // 优先使用从首页传递过来的图片URL（如果有）
          if (this.passedImageUrl) {
            console.log('[图片调试] 优先使用从首页传递的图片URL:', this.passedImageUrl);
            insectInfo.imageUrl = this.passedImageUrl;
            insectInfo.displayImageUrl = this.passedImageUrl;
          }
        }
        
        // 保存默认昆虫信息到本地缓存
        try {
          this.cacheInsectData(insectInfo, '');
        } catch (e) {
          console.error('保存默认昆虫信息到缓存失败:', e);
        }
        
        this.setData({
          insectInfo: insectInfo,
          error: '获取昆虫信息失败',
          loading: false
        });
        
        // 继续获取百度百科内容
        this.fetchBaiduBaikeContent(insectInfo.name);
        
        // 即使出错也resolve，因为页面已显示
        resolve();
      });
    });
  },
  
  // 缓存昆虫数据到本地存储
  cacheInsectData: function(insectInfo, baikeContent) {
    try {
      const cacheKey = `insect_detail_${this.data.insectId}`;
      const currentTime = Date.now();
      const cacheData = {
        insectInfo: insectInfo,
        baikeContent: baikeContent,
        timestamp: currentTime
      };
      wx.setStorageSync(cacheKey, cacheData);
      console.log('昆虫数据缓存成功');
    } catch (e) {
      console.error('缓存昆虫数据失败:', e);
      // 缓存失败不影响程序运行
    }
  },

  // 记录昆虫详情日志 - 与地图标记点详情字段保持一致
  logInsectDetail: function(insectInfo) {
    try {
      // 构建与地图标记点详情一致的日志对象
      const logData = {
        id: insectInfo.id || this.data.insectId, // 使用昆虫ID或页面ID
        name: insectInfo.name, // 昆虫名称
        image: insectInfo.imageUrl, // 昆虫图片URL
        longitude: insectInfo.longitude || '', // 经度（如果有）
        latitude: insectInfo.latitude || '', // 纬度（如果有）
        date: insectInfo.lastFoundDate || '', // 最近发现日期
        location: insectInfo.location || '', // 发现地点（如果有）
        weather: insectInfo.weather || '', // 天气情况（如果有）
        season: insectInfo.season || '', // 季节（如果有）
        time: insectInfo.time || '', // 发现时间（如果有）
        notes: insectInfo.notes || '', // 观察笔记（如果有）
        rare: insectInfo.rare || false, // 是否稀有
        foundCount: insectInfo.foundCount || 0, // 发现次数
        viewTime: new Date().toISOString() // 查看时间
      };
      
      // 记录日志
      console.log('昆虫详情查看日志:', logData);
      
      // 如果需要，可以将日志存储到本地或云端
      // 这里仅作为示例，实际应用中可以根据需求进行扩展
      
    } catch (e) {
      console.error('记录昆虫详情日志失败:', e);
    }
  },

  // 获取百度百科内容（模拟）
  fetchBaiduBaikeContent: function(insectName) {
    // 由于无法直接调用百度百科API，这里使用模拟数据
    // 实际应用中，应该通过云函数调用百度百科API获取内容
    const mockBaikeContent = this.getMockBaikeContent(insectName);
    
    this.setData({
      baikeContent: mockBaikeContent,
      loading: false
    });
    
    // 更新缓存中的百科内容
        try {
          const insectInfo = this.data.insectInfo;
          if (insectInfo) {
            this.cacheInsectData(insectInfo, mockBaikeContent);
          }
        } catch (e) {
          console.error('更新百科内容缓存失败:', e);
        }
    
    // 同时尝试获取分类信息
    this.fetchClassificationInfo(insectName);
  },
  
  // 获取昆虫分类信息
  fetchClassificationInfo: function(insectName) {
    // 模拟获取分类信息
    // 实际应用中，应该通过云函数调用专业API获取详细的分类信息
    const classificationMap = {
      '蝴蝶': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '鳞翅目',
        '科': '锤角亚目'
      },
      '蜜蜂': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '膜翅目',
        '科': '蜜蜂科'
      },
      '蚂蚁': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '膜翅目',
        '科': '蚁科'
      },
      '蜻蜓': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '蜻蜓目',
        '科': '差翅亚目'
      },
      '七星瓢虫': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '鞘翅目',
        '科': '瓢虫科'
      },
      '大刀螳螂': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '螳螂目',
        '科': '螳螂科'
      },
      '蓝闪蝶': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '鳞翅目',
        '科': '蛱蝶科'
      },
      '独角仙': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '鞘翅目',
        '科': '金龟子科'
      },
      '竹节虫': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '竹节虫目',
        '科': '竹节虫科'
      },
      '金龟子': {
        '界': '动物界',
        '门': '节肢动物门',
        '纲': '昆虫纲',
        '目': '鞘翅目',
        '科': '金龟子科'
      }
    };
    
    const classification = classificationMap[insectName] || null;
    
    if (classification) {
      const insectInfo = this.data.insectInfo;
      insectInfo.classification = classification;
      
      this.setData({
        insectInfo: insectInfo
      });
      
      // 更新缓存
      try {
        this.cacheInsectData(insectInfo, this.data.baikeContent);
      } catch (e) {
        console.error('更新分类信息缓存失败:', e);
      }
    }
  },

  // 获取模拟的百度百科内容
  getMockBaikeContent: function(insectName) {
    // 为所有昆虫提供默认的百科模板
    const defaultTemplate = function(name) {
      return `${name}是一种昆虫，属于节肢动物门昆虫纲。它们广泛分布于世界各地的不同生态环境中，有着独特的形态特征和生活习性。${name}在生态系统中扮演着重要的角色，对维持生态平衡有着积极的作用。更多关于${name}的详细信息正在收集中，敬请期待！`;
    };

    const baikeContentMap = {
        '蝴蝶': '蝴蝶是节肢动物门、昆虫纲、鳞翅目、锤角亚目动物的统称。全世界大约有 14000 多种，大部分分布在美洲，尤其在亚马逊河流域品种最多。中国有 1200 种。蝴蝶一般色彩鲜艳，身上有好多条纹，色彩较丰富，翅膀和身体有各种花斑，最大的蝴蝶展翅可达28～30厘米左右，最小的只有 0.7 厘米左右。蝴蝶和蛾类的主要区别是蝴蝶头部有一对棒状或锤状触角，蛾的触角形状多样。',
        '蜜蜂': '蜜蜂在昆虫分类学上属于膜翅目、细腰亚目、针尾部、蜜蜂总科、蜜蜂科昆虫的统称，是膜翅目重要的类群。根据化石资料，蜜蜂在第三纪晚始新世地层中己大量发现，蜜蜂科的许多种类具有巨大的经济价值，与人类生活密切相关。在中国古代就有对蜜蜂及其用途的记载。不少种类的产物或行为与医学(如蜂蜜、王浆、蜂毒)、农业(如作物传粉)、工业(如蜂蜡、蜂胶)有密切关系，它们被称为资源昆虫。',
        '蚂蚁': '蚂蚁是一种昆虫，别名蚁、玄驹、昆蜉、蚍蜉蚂，属节肢动物门，昆虫纲，膜翅目，蚁科。蚂蚁的种类繁多，世界上已知有11700多种，有21亚科283属，中国境内已确定的蚂蚁种类有600多种。最近还发现了无性繁殖的蚂蚁新物种。蚂蚁的寿命很长，工蚁可生存几星期至3-10年，蚁后则可存活几年甚至十年。一个蚁巢在1个地方可生长几年甚至十几年。需要注意的是，白蚁不属于蚂蚁。',
        '蜻蜓': '蜻蜓是无脊椎动物，昆虫纲，蜻蜓目，差翅亚目昆虫的通称。后翅基部比前翅基部稍大，翅脉也稍有不同。休息时四翅展开，平放于两侧。稚虫短粗，具直肠鳃，无尾鳃。包括蜓总科Aeshnoidea、大蜓总科Cordulegastroidea、蜻总科Libelluloidea等3总科，共11科。蜓科和蜻科最为常见，广布于我国各地。',
        '眼斑螳螂': '眼斑螳螂是螳螂目螳螂科的一种昆虫。分布在东南亚多个国家，是一种中型螳螂，体长约4-7厘米。眼斑螳螂最显著的特征是其前翅上有一对类似眼睛的斑点，用于吓退天敌。它们主要以小型昆虫为食，是一种益虫，对控制害虫有一定作用。',
        '步甲幼虫': '步甲是鞘翅目步甲科昆虫的统称，世界已知约2.5万种，中国约800种以上。步甲科昆虫多有着色泽幽暗的鞘翅，翅上常带金属光泽，而且多数种类的后翅都已经退化或者干脆没有后翅。步甲的幼虫身体细长，很多都有肉食性，以其他昆虫为食。',
        '地鳖': '地鳖别名可泡虫、地鳖虫、土鳖、过街、地乌龟、节节虫、臭虫母等。属于昆虫，身体扁，棕黑色，雄的有翅膀，雌的无翅。常在老式土质住宅墙根的土内活动。是市场紧缺的中药材，随着自然环境的破坏，以及国内外市场需求量的逐年扩大尤其以其质量优良而闻名遐迩，野生土元已经远远不能满足市场的需求，在中国亳州中药材交易市场上的价格逐年攀升。',
        '变色树蜥': '变色树蜥是鬣蜥科、树蜥属的爬行动物。头体长10-12厘米，尾长大约30厘米。变色树蜥背面浅棕色，杂有深棕斑块；眼四周有辐射状黑纹。生殖季节雄性头部为红色。体色可随环境干湿、光线强弱而变。鳞片十分粗糙；背部有一例像鸡冠的脊突，所以又叫鸡冠蛇。头较大，吻端钝圆，吻棱明显。眼碱发达。鼓膜裸露，无肩褶。体背鳞片具棱呈覆瓦状排列；背中线上，由颈至尾基部有一列侧扁而直立的鬣鳞，颈部的较长，形如马鬃。四肢发达，前后肢有五指、趾，均具爪。',
        '牡丹鹦鹉': '牡丹鹦鹉属的鸟类体长13-17厘米，体重40-60克，喙红色，眼及蜡膜白色。头部黑褐色，颈部有赤黄色的环带。上胸浅绿色，背部和翼为绿色，翼端呈黑色，尾绿色，脚灰色。另有棕头牡丹鹦鹉，头部棕褐色，俗称棕头牡丹。野生的牡丹鹦鹉生活在热带丛林中，常集小群生活，一般在树洞中营巢繁殖，以各种植物种子、水果、桨果、蔬菜、一些草及种子为食。黑领牡丹鹦鹉亦会食无花果。',
        '幽灵螳螂': '幽灵螳螂是螳螂目螳螂科的一种昆虫，主要分布在非洲和东南亚地区。幽灵螳螂体型较小，通常只有4-5厘米长，身体细长，具有出色的拟态能力，能模仿枯萎的树叶或树枝，帮助它们在自然环境中躲避天敌和捕食猎物。幽灵螳螂以各种小型昆虫为食，是一种益虫。',
        '蓝舌石龙子': '蓝舌石龙子是石龙子科的一种爬行动物，主要分布在澳大利亚和新几内亚。蓝舌石龙子最显著的特征是其蓝色的舌头，用于威慑天敌。它们体型较大，通常可达30-45厘米长，身体粗壮，四肢短小。蓝舌石龙子是杂食性动物，以昆虫、小型脊椎动物、果实和植物为食。',
        '中华大扁锹': '中华大扁锹是鞘翅目锹甲科的一种昆虫，主要分布在中国南方地区。中华大扁锹体型较大，雄虫体长可达70毫米，最显著的特征是其巨大的上颚，用于争夺领地和配偶。雌虫上颚较小。中华大扁锹的幼虫生活在腐木中，以腐木为食，成虫则以树汁为食。',
        '蓝孔雀': '蓝孔雀是鸡形目雉科孔雀属的一种鸟类，主要分布在印度和斯里兰卡。蓝孔雀是最常见的孔雀品种，雄鸟具有华丽的尾屏，上面有许多眼状斑，用于求偶展示。雌鸟体型较小，羽毛颜色较暗淡。蓝孔雀是杂食性动物，以种子、果实、昆虫和小型脊椎动物为食。',
        '姬兜': '姬兜是鞘翅目金龟子科的一种昆虫，主要分布在中国南方和东南亚地区。姬兜体型较大，雄虫体长可达60毫米，最显著的特征是其头部的角状突起，用于争夺领地和配偶。雌虫没有角状突起。姬兜的幼虫生活在腐木或土壤中，以腐殖质为食，成虫则以树汁和果实为食。',
        '苏里南潜螈': '苏里南潜螈是有尾目钝口螈科的一种两栖动物，主要分布在南美洲的苏里南、圭亚那和巴西等地区。苏里南潜螈体型较大，通常可达30-40厘米长，身体细长，四肢短小。它们生活在清澈的溪流和河流中，以昆虫、小型甲壳类动物和鱼类为食。苏里南潜螈具有再生能力，能够再生失去的肢体和其他身体部位。',
        '锹甲': '锹甲是鞘翅目锹甲科昆虫的统称，全球约有1200多种。锹甲最显著的特征是雄性成虫具有发达的上颚，形状类似于鹿角，用于争夺领地和配偶。锹甲体型差异较大，小型种类体长仅数毫米，大型种类可达10厘米以上。锹甲的幼虫生活在腐木中，以腐木为食，成虫则主要以树汁为食。',
        '独角仙': '独角仙，学名双叉犀金龟，是鞘翅目金龟子科的一种昆虫。独角仙体型较大，体长可达50-60毫米，最显著的特征是雄性头部有一根巨大的角状突起，用于争夺领地和配偶。独角仙的幼虫生活在腐木或腐殖土中，以腐殖质为食，成虫则以树汁和果实为食。独角仙在一些地区被作为宠物饲养，也可作为中药材使用。',
        '金龟子': '金龟子是鞘翅目金龟子科昆虫的统称，全球约有3万多种。金龟子体型差异较大，小的仅数毫米，大的可达10厘米以上。金龟子的体色多样，常见的有铜色、绿色、褐色等，有些种类具有金属光泽。金龟子的幼虫称为蛴螬，生活在土壤中，以植物的根和地下茎为食，是重要的地下害虫。成虫则以植物的叶、花、果实为食。',
        '七星瓢虫': '七星瓢虫是鞘翅目瓢虫科的一种昆虫，因背部有七个黑色斑点而得名。七星瓢虫体型较小，体长约5-7毫米，身体呈半球形，体色鲜艳，通常为红色或橙色。七星瓢虫是著名的益虫，主要以蚜虫为食，一只七星瓢虫的成虫一天可捕食100多只蚜虫，对控制蚜虫危害有重要作用。',
        '竹节虫': '竹节虫是竹节虫目昆虫的统称，因身体细长，形状像竹节而得名。竹节虫体型差异较大，小型种类体长仅数厘米，大型种类可达30厘米以上。竹节虫具有出色的拟态能力，能模仿竹子、树枝或树叶的形态和颜色，帮助它们在自然环境中躲避天敌。竹节虫主要以植物的叶子为食，多数种类为植食性。',
        '大刀螳螂': '大刀螳螂是螳螂目螳螂科的一种昆虫，是中国常见的螳螂种类之一。大刀螳螂体型较大，体长可达7-10厘米，最显著的特征是其前肢像大刀一样发达，上面有锯齿状的刺，用于捕捉猎物。大刀螳螂是肉食性昆虫，主要以各种小型昆虫为食，是一种重要的益虫，对控制害虫有一定作用。',
        '蓝闪蝶': '蓝闪蝶是鳞翅目蛱蝶科的一种蝴蝶，主要分布在南美洲的热带雨林中。蓝闪蝶体型较大，翅展可达10-12厘米，最显著的特征是其翅膀具有强烈的蓝色金属光泽，在阳光下会闪烁出耀眼的光芒。蓝闪蝶的幼虫主要以豆科植物为食，成虫则以花蜜为食。蓝闪蝶是世界著名的观赏蝴蝶之一。'    };
    
    // 优先使用映射表中的内容，如果没有则使用默认模板
    return baikeContentMap[insectName] || defaultTemplate(insectName);
  },

  // 下拉刷新事件处理函数
  onPullDownRefresh: function() {
    console.log('触发下拉刷新，重新加载昆虫详情数据');
    
    // 设置加载状态
    this.setData({
      loading: true,
      error: ''
    });
    
    // 标记当前为下拉刷新模式
    this.isPullingDownRefresh = true;
    
    // 保留本地缓存，但强制从云端获取最新数据（不再清除缓存）
    // 这样即使云端数据有问题，仍然可以保留本地编辑的内容
    console.log('下拉刷新模式：强制从云端获取最新数据，但保留本地缓存作为后备');
    
    // 重新加载数据
    this.loadInsectDetail().then(() => {
      // 结束下拉刷新动画
      wx.stopPullDownRefresh();
      // 重置下拉刷新标记
      this.isPullingDownRefresh = false;
    }).catch(() => {
      // 加载失败也结束下拉刷新动画
      wx.stopPullDownRefresh();
      // 重置下拉刷新标记
      this.isPullingDownRefresh = false;
    });
  },

  // 添加观察笔记
  addObservationNotes: function() {
    const insectInfo = this.data.insectInfo;
    if (!insectInfo) {
      wx.showToast({
        title: '昆虫信息加载中',
        icon: 'none'
      });
      return;
    }
    
    // 准备传递给编辑页面的参数
    let params = {
      insectId: insectInfo._id || '',
      insectName: encodeURIComponent(insectInfo.name),
      imagePath: encodeURIComponent(insectInfo.imageUrl),
      longitude: this.data.longitude || (insectInfo.longitude || ''),
      latitude: this.data.latitude || (insectInfo.latitude || '')
    };
    
    // 如果有最后发现日期，也传递过去
    if (insectInfo.lastFoundDate) {
      params.discoveryDate = encodeURIComponent(insectInfo.lastFoundDate);
    }
    
    // 如果有笔记内容，也传递过去
    if (insectInfo.notes) {
      params.notesContent = encodeURIComponent(insectInfo.notes);
    }
    
    // 构建URL参数
    let urlParams = [];
    for (let key in params) {
      if (params[key]) {
        urlParams.push(`${key}=${params[key]}`);
      }
    }
    
    // 跳转到编辑发现页面，并传递昆虫信息
    wx.navigateTo({
      url: `/pages/edit-discovery/edit-discovery?${urlParams.join('&')}`
    });
  },

  // 返回上一页 - 添加数据同步机制
  onBackTap: function() {
    const insectInfo = this.data.insectInfo;
    const isEditMode = !this.data.isNewDiscovery;
    
    // 获取页面栈
    const pages = getCurrentPages();
    // 如果存在上一页（首页），尝试刷新其数据
    if (pages.length > 1) {
      const previousPage = pages[pages.length - 2];
      
      // 重要修复：如果是编辑模式并且上一页可能是首页，额外传递当前正确的发现次数
      if (isEditMode && previousPage && previousPage.data) {
        console.log('编辑模式返回首页：传递正确的发现次数以便同步');
        // 设置一个临时标志，让首页知道需要特殊处理这个昆虫的发现次数
        previousPage.setData({
          'insectCorrectionData': {
            insectId: insectInfo._id || insectInfo.name,
            correctFoundCount: insectInfo.foundCount
          }
        });
      }
      
      // 检查上一页是否有loadUserData方法（通常是首页）
      if (previousPage && typeof previousPage.loadUserData === 'function') {
        console.log('返回前通知上一页刷新数据');
        previousPage.loadUserData();
      }
    }
    wx.navigateBack();
  },

  // 增强的图片加载失败处理
  onImageError: function(e) {
    console.log('昆虫图片加载失败:', e);
    const insectInfo = this.data.insectInfo;
    const currentImageUrl = insectInfo.imageUrl;
    const defaultImageUrl = '/images/default_insect.png';
    
    // 首先尝试使用本地默认图片，确保页面不会显示空白
    if (currentImageUrl !== defaultImageUrl) {
      console.log(`为昆虫 ${insectInfo.name} 设置默认图片`);
      const updatedInsectInfo = {
        ...insectInfo,
        imageUrl: defaultImageUrl,
        imageLoadStatus: 'default'
      };
      
      this.setData({
        insectInfo: updatedInsectInfo
      });
    }
    
    // 同时在后台尝试重新获取图片信息，提高用户体验
    this.tryToReloadImage(insectInfo.name);
  },
  
  // 尝试重新加载图片信息
  tryToReloadImage: function(insectName) {
    console.log(`尝试为昆虫 ${insectName} 重新加载图片信息`);
    
    // 立即设置默认图片，确保用户看到的不是空白
    const defaultImageUrl = '/images/default_insect.png';
    const insectInfo = this.data.insectInfo;
    
    if (insectInfo && insectInfo.imageUrl !== defaultImageUrl) {
      const updatedInsectInfo = {
        ...insectInfo,
        imageUrl: defaultImageUrl,
        imageLoadStatus: 'default'
      };
      
      this.setData({
        insectInfo: updatedInsectInfo
      });
    }
    
    // 1. 从本地预设的图片URL映射表中查找备用图片
    const insectImageUrls = {
      '眼斑螳螂': 'https://img.alicdn.com/imgextra/i4/O1CN013K3I9x1HdM03H95uY_!!6000000000451-0-lubanu.jpg',
      '步甲幼虫': 'https://img.alicdn.com/imgextra/i1/O1CN014mK94O1fXsUq3z8bW_!!6000000003510-0-lubanu.jpg',
      '地鳖': 'https://img.alicdn.com/imgextra/i4/O1CN01z72Fg21j6gZt73zPm_!!6000000004386-0-lubanu.jpg',
      '蝴蝶': 'https://img.alicdn.com/imgextra/i2/O1CN01Kq1tVr1L2D4cVqGqT_!!6000000001025-0-lubanu.jpg',
      '蜜蜂': 'https://img.alicdn.com/imgextra/i1/O1CN01uD6bX71B1o5W5v5y0_!!6000000000191-0-lubanu.jpg',
      '蚂蚁': 'https://img.alicdn.com/imgextra/i4/O1CN010B2d0n1Rq9FkXhN6c_!!6000000002379-0-lubanu.jpg',
      '蜻蜓': 'https://img.alicdn.com/imgextra/i2/O1CN01Gz5h9q1Wk9WxJ7G1t_!!6000000002968-0-lubanu.jpg',
      '变色树蜥': 'https://img.alicdn.com/imgextra/i4/O1CN01Vg02Vd1T7oHf0t6w9_!!6000000003693-0-lubanu.jpg',
      '牡丹鹦鹉': 'https://img.alicdn.com/imgextra/i3/O1CN01ZkX2Xv1lZqLw7g67X_!!6000000004948-0-lubanu.jpg',
      '幽灵螳螂': 'https://img.alicdn.com/imgextra/i3/O1CN0189y3p21wYd9Z3eZfF_!!6000000006304-0-lubanu.jpg',
      '蓝舌石龙子': 'https://img.alicdn.com/imgextra/i4/O1CN01rNnY6G1WfC1l038jZ_!!6000000002910-0-lubanu.jpg',
      '中华大扁锹': 'https://img.alicdn.com/imgextra/i1/O1CN01hV5x8z1rZ10bJ4n2f_!!6000000006163-0-lubanu.jpg',
      '蓝孔雀': 'https://img.alicdn.com/imgextra/i2/O1CN01lI3jBm1tFm4aG1JkZ_!!6000000005907-0-lubanu.jpg',
      '姬兜': 'https://img.alicdn.com/imgextra/i2/O1CN01zR5x2k1cX8x2Z2W5M_!!6000000003306-0-lubanu.jpg', // 使用新的姬兜图片URL
      '苏里南潜螈': 'https://img.alicdn.com/imgextra/i2/O1CN01pO5w1j1eQvC6h5a2K_!!6000000002823-0-lubanu.jpg',
      '苏里南潜蠊': 'https://img.alicdn.com/imgextra/i2/O1CN01pO5w1j1eQvC6h5a2K_!!6000000002823-0-lubanu.jpg', // 添加苏里南潜蠊的图片URL
      '锹甲': 'https://img.alicdn.com/imgextra/i3/O1CN01dI9Z0G1y1j5v5n5rF_!!6000000006098-0-lubanu.jpg',
      '独角仙': 'https://img.alicdn.com/imgextra/i2/O1CN01E5P1dT1L0R6q3w2XQ_!!6000000001071-0-lubanu.jpg',
      '金龟子': 'https://img.alicdn.com/imgextra/i2/O1CN01Jv8V9h1nT9Q5h2Q5F_!!6000000005109-0-lubanu.jpg',
      '七星瓢虫': 'https://img.alicdn.com/imgextra/i3/O1CN018zR3m21o3X2c3m5fQ_!!6000000005090-0-lubanu.jpg',
      '竹节虫': 'https://img.alicdn.com/imgextra/i3/O1CN01qF0b3P1X8h1M6a3p9_!!6000000003618-0-lubanu.jpg',
      '大刀螳螂': 'https://img.alicdn.com/imgextra/i2/O1CN01j6c3WJ1b4K5h5z4Xf_!!6000000002719-0-lubanu.jpg',
      '蓝闪蝶': 'https://img.alicdn.com/imgextra/i4/O1CN01r4QnHh1l9v2a3e6j5_!!6000000004776-0-lubanu.jpg'
    };
    
    // 检查是否有备用图片URL，添加更宽松的匹配逻辑
    const insectNameLower = insectName.toLowerCase();
    let alternativeUrl = null;
    
    // 优先完全匹配
    for (const [key, value] of Object.entries(insectImageUrls)) {
      if (key.toLowerCase() === insectNameLower) {
        alternativeUrl = value;
        break;
      }
    }
    
    // 如果完全匹配失败，尝试部分匹配
    if (!alternativeUrl) {
      for (const [key, value] of Object.entries(insectImageUrls)) {
        if (key.toLowerCase().includes(insectNameLower) || insectNameLower.includes(key.toLowerCase())) {
          alternativeUrl = value;
          break;
        }
      }
    }
    
    // 如果有备用URL，尝试先验证其有效性
    if (alternativeUrl) {
      // 延迟验证，避免阻塞主线程
      setTimeout(() => {
        this.validateImageUrl(alternativeUrl, (isValid) => {
          if (isValid) {
            console.log(`验证成功，昆虫 ${insectName} 有有效的备用图片URL`);
            
            // 更新图片URL
            const insectInfo = this.data.insectInfo;
            if (insectInfo) {
              const updatedInsectInfo = {
                ...insectInfo,
                imageUrl: alternativeUrl,
                imageLoadStatus: 'success'
              };
              
              this.setData({
                insectInfo: updatedInsectInfo
              });
              
              // 更新缓存
              this.cacheInsectData(updatedInsectInfo, this.data.baikeContent);
            }
          }
        });
      }, 1000);
    }
    
    // 同时从数据库获取最新图片信息，作为第二道保障
    this.fetchImageFromDatabase(insectName);
  },
  
  // 验证图片URL是否有效
  validateImageUrl: function(url, callback) {
    // 在微信小程序中，使用wx.createImage()而不是new Image()
    const img = wx.createImage();
    let timeout = null;
    
    img.onload = function() {
      clearTimeout(timeout);
      callback(true);
    };
    
    img.onerror = function() {
      clearTimeout(timeout);
      callback(false);
    };
    
    // 设置超时，避免长时间等待
    timeout = setTimeout(function() {
      callback(false);
    }, 3000);
    
    img.src = url;
  },
  
  // 从数据库获取最新图片信息
  fetchImageFromDatabase: function(insectName) {
    const db = wx.cloud.database();
    
    // 查找昆虫信息
    db.collection('insects')
      .where({
        name: insectName
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const insectData = res.data[0];
          if (insectData.imageUrl) {
            console.log(`从数据库获取到昆虫 ${insectName} 的图片URL`);
            
            // 验证从数据库获取的URL
            this.validateImageUrl(insectData.imageUrl, (isValid) => {
              if (isValid) {
                const insectInfo = this.data.insectInfo;
                if (insectInfo) {
                  const updatedInsectInfo = {
                    ...insectInfo,
                    imageUrl: insectData.imageUrl,
                    imageLoadStatus: 'success'
                  };
                  
                  this.setData({
                    insectInfo: updatedInsectInfo
                  });
                  
                  // 更新缓存
                  this.cacheInsectData(updatedInsectInfo, this.data.baikeContent);
                }
              }
            });
          }
        }
      })
      .catch(err => {
        console.error(`从数据库获取昆虫 ${insectName} 图片信息失败:`, err);
      });
  },

  // 更新观察笔记
  updateObservationNotes: function(discoveryData) {
    console.log('===== 开始更新观察笔记 =====');
    console.log('传入的discoveryData:', JSON.stringify(discoveryData));
    
    if (!discoveryData || !this.data.insectInfo) {
      console.log('数据不完整，无法更新观察笔记');
      return;
    }
    
    const insectInfo = this.data.insectInfo;
    const updatedInsectInfo = { ...insectInfo };
    
    // 记录更新前的昆虫信息
    console.log('更新前的昆虫信息:', {
      name: insectInfo.name,
      foundCount: insectInfo.foundCount,
      lastFoundTime: insectInfo.lastFoundTime,
      notes: insectInfo.notes,
      notesList: insectInfo.notesList ? insectInfo.notesList.length : 0
    });
    
    // 确保 isNewDiscovery 存在，默认为 false
    if (discoveryData.isNewDiscovery === undefined) {
      discoveryData.isNewDiscovery = false;
      console.log('设置isNewDiscovery默认为false');
    }
    
    console.log('当前isNewDiscovery状态:', discoveryData.isNewDiscovery);
    
    // 更新昆虫信息
    if (discoveryData.name) {
      updatedInsectInfo.name = discoveryData.name;
    }
    
    if (discoveryData.image) {
      updatedInsectInfo.imageUrl = discoveryData.image;
    }
    
    if (discoveryData.date) {
      updatedInsectInfo.lastFoundDate = discoveryData.date;
      updatedInsectInfo.lastFoundTime = new Date(discoveryData.date).toISOString();
    }
    
    // 更新位置信息
    if (discoveryData.longitude) {
      updatedInsectInfo.longitude = discoveryData.longitude;
    }
    
    if (discoveryData.latitude) {
      updatedInsectInfo.latitude = discoveryData.latitude;
    }
    
    if (discoveryData.locationName) {
      updatedInsectInfo.location = discoveryData.locationName;
    }
    
    // 检查是否需要更新笔记数量
    // 需求6：若发现次数未增加，该昆虫的观察笔记列表应仅保留当前已有的一条记录
    // 需求7：若发现次数增加1次，系统应支持通过编辑观察笔记功能为该昆虫新增一条独立的观察笔记记录
    
    // 这里我们假设，如果discoveryData中包含新的notes，则需要更新昆虫的观察笔记
    if (discoveryData.notes) {
      // 获取当前的发现次数
      const currentFoundCount = updatedInsectInfo.foundCount || 0;
      
      // 初始化notesList数组（如果不存在）
      if (!updatedInsectInfo.notesList) {
        updatedInsectInfo.notesList = [];
      }
      
      // 创建新的笔记对象
      const newNote = {
        id: `note_${Date.now()}`,
        content: discoveryData.notes,
        date: discoveryData.date,
        time: discoveryData.time || '',
        weather: discoveryData.weather || '',
        season: discoveryData.season || '',
        rare: discoveryData.rare || false,
        createTime: new Date().toISOString()
      };
      
      // 检查是否应该添加新笔记或更新现有笔记
      if (discoveryData.isNewDiscovery) {
        // 如果是新发现，则添加新笔记并增加发现次数
        updatedInsectInfo.foundCount = currentFoundCount + 1;
        updatedInsectInfo.notesList.push(newNote);
        console.log('添加新笔记，发现次数增加到:', updatedInsectInfo.foundCount);
        console.log('新笔记内容:', newNote.content);
        // 只有在新发现时才更新lastFoundTime，避免编辑时导致首页置顶
        updatedInsectInfo.lastFoundTime = new Date(discoveryData.date).toISOString();
        console.log('新发现模式：更新lastFoundTime为:', updatedInsectInfo.lastFoundTime);
      } else {
        // 如果不是新发现，则更新最新的笔记（保留一条）
        // 确保notesList中只保留一条记录（需求6）
        updatedInsectInfo.notesList = [newNote];
        console.log('更新现有笔记，保持发现次数不变:', currentFoundCount);
        console.log('更新后笔记内容:', newNote.content);
        // 编辑时不更新lastFoundTime，避免在首页置顶
        console.log('编辑模式：保留原始lastFoundTime:', insectInfo.lastFoundTime);
        // 手动确保lastFoundTime不被修改
        updatedInsectInfo.lastFoundTime = insectInfo.lastFoundTime;
      }
      
      // 同时将最新的笔记内容也保存到notes字段中，便于在页面上快速显示
      updatedInsectInfo.notes = discoveryData.notes;
    }
    
    // 更新数据并刷新页面
    this.setData({
      insectInfo: updatedInsectInfo
    }, () => {
      console.log('观察笔记更新成功');
      
      // 更新缓存
      this.cacheInsectData(updatedInsectInfo, this.data.baikeContent);
      
      // 记录更新后的数据
      console.log('更新后昆虫信息:', {
        name: updatedInsectInfo.name,
        foundCount: updatedInsectInfo.foundCount,
        lastFoundTime: updatedInsectInfo.lastFoundTime,
        notes: updatedInsectInfo.notes,
        notesList: updatedInsectInfo.notesList ? updatedInsectInfo.notesList.length : 0
      });
      
      // 立即更新缓存，确保编辑后的笔记和发现次数立即保存到本地
      this.cacheInsectData(updatedInsectInfo, this.data.baikeContent);

      // 调用云函数将笔记数据持久化到云端
      const app = getApp();
      if (app.globalData.openid) {
        // 重要修复：在调用云函数前再次验证isNewDiscovery状态
        // 确保编辑模式下绝对不会被错误标记为新发现
        const safeIsNewDiscovery = discoveryData.isNewDiscovery === true;
        
        const cloudFunctionData = {
          name: updatedInsectInfo.name,
          notes: updatedInsectInfo.notes,
          notesList: updatedInsectInfo.notesList,
          // 传递是否为新发现的标记，使用安全验证后的值
          isNewDiscovery: safeIsNewDiscovery,
          // 明确传递当前的发现次数，便于云端验证
          currentFoundCount: updatedInsectInfo.foundCount,
          // 添加用户上传的图片URL，确保云端能正确保存
          userImageUrl: updatedInsectInfo.userImageUrl
        };
        
        console.log('调用云函数markFound参数:', JSON.stringify(cloudFunctionData));
        console.log('调用前isNewDiscovery安全验证结果:', safeIsNewDiscovery);
        console.log('调用前确认当前发现次数:', updatedInsectInfo.foundCount);
        // 增加关键警告日志，确保编辑模式下不会增加发现次数
        if (!safeIsNewDiscovery) {
          console.log('===== 编辑模式严格警告 =====');
          console.log('调用云函数时明确标记为非新发现，确保发现次数不会增加');
          console.log('当前发现次数将被严格保护：', updatedInsectInfo.foundCount);
          console.log('===== 编辑模式严格警告 =====');
        }
        
        wx.cloud.callFunction({
          name: 'markFound',
          data: cloudFunctionData,
          success: res => {
            console.log('笔记数据保存到云端成功:', res);
            console.log('云端返回数据:', JSON.stringify(res.result));
            
            // 关键修复：使用云端返回的数据更新本地状态和缓存
            if (res.result && res.result.success) {
              // 重要修复：根据isNewDiscovery状态决定是否使用云端返回的foundCount值
            // 当isNewDiscovery为false时，强制保持本地的foundCount不变，忽略云端返回值
            const shouldUseCloudCount = discoveryData.isNewDiscovery === true;
            
            // 记录原始的本地发现次数，确保在任何情况下都能恢复
            const originalLocalCount = updatedInsectInfo.foundCount;
            console.log('本地原始发现次数记录:', originalLocalCount);
            
            // 重点修复：创建一个新对象，确保完全控制要更新的字段
            // 这可以防止任何意外的属性继承或修改
            const refreshedInsectInfo = {
              ...updatedInsectInfo,
              // 编辑模式下严格使用本地原始值，完全忽略云端返回的foundCount
              // 这是最关键的保护措施，确保发现次数不会被意外增加
              foundCount: shouldUseCloudCount ? res.result.foundCount : originalLocalCount,
              // 从云端返回的debugInfo中确认isNewDiscovery和shouldIncrementCount状态
              debugInfo: res.result.data ? res.result.data.debugInfo : {}
            };
            
            // 新增：添加发现次数的最终安全检查
            // 无论什么情况，编辑模式下都必须确保发现次数不变
            if (!shouldUseCloudCount && refreshedInsectInfo.foundCount !== originalLocalCount) {
              console.log('编辑模式终极安全警报：发现次数出现不一致！强制恢复为原始值');
              console.log('不一致详情：原始值=' + originalLocalCount + ', 当前值=' + refreshedInsectInfo.foundCount + ', 云端返回值=' + res.result.foundCount);
              refreshedInsectInfo.foundCount = originalLocalCount;
            }
            
            console.log('编辑模式状态:', discoveryData.isNewDiscovery ? '新发现' : '编辑现有');
            console.log('是否应该使用云端返回的foundCount值:', shouldUseCloudCount);
            console.log('云端返回的foundCount值:', res.result.foundCount);
            console.log('本地计算的foundCount值:', originalLocalCount);
            console.log('最终使用的foundCount值:', refreshedInsectInfo.foundCount);
            
            // 增加关键日志，记录编辑模式下的严格保护
            if (!discoveryData.isNewDiscovery) {
              console.log('编辑模式严格保护：强制保持本地发现次数不变，不受云端返回值影响');
              console.log('编辑模式终极保护：完全忽略云端返回的foundCount值，始终使用本地计算的原始值');
            }
            
            // 额外的安全检查，确保无论如何都不会修改foundCount
            if (!discoveryData.isNewDiscovery && refreshedInsectInfo.foundCount !== originalLocalCount) {
              console.log('安全警报：发现次数被意外修改！立即恢复为原始值');
              refreshedInsectInfo.foundCount = originalLocalCount;
              console.log('已恢复为原始发现次数:', refreshedInsectInfo.foundCount);
            }
              
              console.log('使用云端返回数据更新本地状态:', JSON.stringify(refreshedInsectInfo));
              
              // 更新页面显示的数据
              this.setData({
                'insectInfo.foundCount': refreshedInsectInfo.foundCount,
                'insectInfo.notes': refreshedInsectInfo.notes,
                'insectInfo.notesList': refreshedInsectInfo.notesList,
                'insectInfo.userImageUrl': refreshedInsectInfo.userImageUrl
              });
              
              // 重要修复：将正确的发现次数保存到本地缓存，防止云端数据错误
              const insectInfo = refreshedInsectInfo;
              const localFoundCountCache = wx.getStorageSync('insectFoundCountCache') || {};
              localFoundCountCache[insectInfo._id] = insectInfo.foundCount;
              localFoundCountCache[insectInfo.name] = insectInfo.foundCount; // 也按名称保存一份，增加容错性
              wx.setStorageSync('insectFoundCountCache', localFoundCountCache);
              console.log(`保存昆虫发现次数到本地缓存: ${insectInfo.name}，次数=${insectInfo.foundCount}`);
              
              // 重新更新缓存，确保下次打开页面时使用最新数据
              this.cacheInsectData(refreshedInsectInfo, this.data.baikeContent);
            }
          },
          fail: err => {
            console.error('笔记数据保存到云端失败:', err);
            // 云端保存失败不影响本地功能，但需要更新UI提示用户
            wx.showToast({
              title: '云端保存失败，请稍后再试',
              icon: 'none'
            });
          }
        });
      }
      
      console.log('===== 更新观察笔记完成 =====');
      
      // 显示更新成功提示
      wx.showToast({
        title: '观察笔记已更新',
        icon: 'success'
      });
    });
  },
  
  // 分享功能
  onShareAppMessage: function() {
    if (this.data.insectInfo) {
      return {
        title: `我发现了${this.data.insectInfo.name}，快来看看！`,
        path: `/pages/insect-detail/insect-detail?id=${this.data.insectId}`
      };
    }
    return {};
  }
});