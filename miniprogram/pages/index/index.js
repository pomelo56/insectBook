// pages/index/index.js
const app = getApp();

Page({
  data: {
    collectedCount: 0,
    totalCount: 0,
    progressPercent: 0,
    recentInsects: [],
    // 用户等级徽章信息 - 临时设定，预留后续调整空间
    currentBadge: {
      level: 1,
      name: '昆虫萌新',
      icon: '/images/icons/bug1.svg',
      progress: '1/15'
    }
  },

  onLoad: function() {
    this.loadUserData();
  },

  onShow: function() {
    const app = getApp();
    // 每次页面显示都重新加载数据，确保数据最新
    console.log('页面显示，刷新首页数据');
    // 如果检测到需要刷新数据的标记，则先清除本地缓存再重新加载
    if (app.globalData.needRefreshHomePage) {
      console.log('检测到需要刷新首页数据的标记，开始强制刷新');
      // 清除首页相关的本地缓存
      wx.removeStorageSync('user_insects_list');
      wx.removeStorageSync('recent_insects');
      // 重置标记
      app.globalData.needRefreshHomePage = false;
    }
    this.loadUserData();
  },
  
  // 页面初次渲染完成后调用
  onReady: function() {
    // 页面渲染完成后，触发图片自动补齐功能
    this.checkAndLoadMissingImages();
  },

  // 加载用户数据
  loadUserData: function() {
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 获取本地保存的昆虫发现次数缓存
    const localFoundCountCache = wx.getStorageSync('insectFoundCountCache') || {};
    
    // 检查是否有openid
    if (!app.globalData.openid) {
      console.log('未获取到openid，尝试等待后重试');
      // 如果未获取到openid，等待一段时间后重试
      setTimeout(() => {
        this.loadUserData();
      }, 500);
      return;
    }
    
    console.log('开始加载用户数据，当前openid:', app.globalData.openid);
    
    // 首先检查是否有本地缓存的数据可以使用
    const cachedUserInsects = wx.getStorageSync('user_insects_list');
    const cachedRecentInsects = wx.getStorageSync('recent_insects');
    
    // 获取用户发现的昆虫数量（去重后的）
    // 使用基础查询方式替代group聚合，兼容更多环境
    db.collection('user_insects')
      .where({
        _openid: app.globalData.openid
      })
      .field({
        insectId: true
      })
      .get()
      .then(res => {
        console.log('获取用户昆虫记录成功，数量:', res.data.length);
        
        // 从数据中提取唯一的insectId并计算数量
        const uniqueInsectIds = new Set();
        res.data.forEach(item => {
          uniqueInsectIds.add(item.insectId);
        });
        
        const collectedCount = uniqueInsectIds.size;
        this.setData({
          collectedCount: collectedCount
        });
        
        // 保存发现数量到本地缓存
        wx.setStorageSync('collectedCount', collectedCount);
        
        // 获取昆虫总数
        return db.collection('insects').count();
      })
      .then(res => {
        const totalCount = res.total || 0;
        this.setData({
          totalCount: totalCount,
          progressPercent: this.data.collectedCount > 0 ? 
            Math.round((this.data.collectedCount / totalCount) * 100) : 0
        });
        
        console.log('昆虫总数:', totalCount, '已收集:', this.data.collectedCount, '进度:', this.data.progressPercent + '%');
        
        // 获取最近发现的昆虫（最多10个）
        return db.collection('user_insects')
          .where({
            _openid: app.globalData.openid
          })
          .orderBy('lastFoundTime', 'desc')
          .limit(10)
          .get();
      })
      .then(res => {
        if (res.data.length > 0) {
          console.log('获取最近发现的昆虫成功，数量:', res.data.length);
          
          // 保存原始数据到本地缓存作为后备
          wx.setStorageSync('user_insects_list', res.data);
          // 增强去重逻辑 - 确保完全去重
          const insectMap = new Map(); // 使用Map确保去重的严格性
          
          // 首先按昆虫ID分组，保留最新的记录
          res.data.forEach(item => {
            const existingItem = insectMap.get(item.insectId);
            if (!existingItem || item.lastFoundTime > existingItem.lastFoundTime) {
              insectMap.set(item.insectId, item);
            }
          });
          
          // 重要修复：检查是否有从详情页传递过来的昆虫发现次数纠正数据
          if (this.data.insectCorrectionData) {
            const { insectId, correctFoundCount } = this.data.insectCorrectionData;
            console.log(`发现需要纠正的昆虫数据: ID=${insectId}, 正确的发现次数=${correctFoundCount}`);
            
            // 遍历所有记录，找出需要纠正的昆虫
            res.data.forEach(item => {
              if (item.insectId === insectId || item.name === insectId) {
                console.log(`找到需要纠正的昆虫记录: ${item.name}，原始发现次数=${item.foundCount}，纠正为=${correctFoundCount}`);
                // 直接在源数据中修改发现次数
                item.foundCount = correctFoundCount;
                // 同时更新map中的记录
                insectMap.set(item.insectId, item);
              }
            });
            
            // 纠正完成后清除临时数据，避免重复处理
            this.setData({
              insectCorrectionData: null
            });
          }
          
          // 然后再次检查是否有名称相同但ID不同的记录
          const nameToIdMap = new Map();
          const finalUniqueInsects = [];
          
          insectMap.forEach((item, insectId) => {
            const normalizedName = item.name.trim(); // 标准化名称，去除空格
            
            if (!nameToIdMap.has(normalizedName)) {
              nameToIdMap.set(normalizedName, insectId);
              finalUniqueInsects.push(item);
            } else {
              // 如果有相同名称的昆虫，保留发现次数更多的
              const existingId = nameToIdMap.get(normalizedName);
              const existingItem = insectMap.get(existingId);
              
              if (item.foundCount > existingItem.foundCount) {
                // 如果当前项发现次数更多，则替换
                nameToIdMap.set(normalizedName, insectId);
                // 找到已添加的索引并替换
                const index = finalUniqueInsects.findIndex(i => i.insectId === existingId);
                if (index !== -1) {
                  finalUniqueInsects[index] = item;
                }
              }
            }
          });
        
        const uniqueInsects = finalUniqueInsects;
        const insectIds = uniqueInsects.map(item => item.insectId);
        
        // 获取昆虫详细信息
        return db.collection('insects').where({
          _id: _.in(insectIds)
        }).get().then(insectRes => {
          // 合并数据
          const recentInsects = uniqueInsects.map(userInsect => {
            const insectInfo = insectRes.data.find(i => i._id === userInsect.insectId) || {};
            
            // 使用本地缓存的发现次数
            let foundCount = userInsect.foundCount;
            const insectId = userInsect.insectId;
            const insectName = userInsect.name;
            
            // 检查是否有本地缓存的发现次数
            if (localFoundCountCache[insectId]) {
              console.log(`从本地缓存恢复发现次数: ${insectName}，缓存次数=${localFoundCountCache[insectId]}，云端次数=${foundCount}`);
              foundCount = localFoundCountCache[insectId];
            } else if (localFoundCountCache[insectName]) {
              console.log(`从本地缓存恢复发现次数(按名称): ${insectName}，缓存次数=${localFoundCountCache[insectName]}，云端次数=${foundCount}`);
              foundCount = localFoundCountCache[insectName];
            }
            
            // 增强图片获取逻辑，确保所有昆虫都能显示图片
            let imageUrl = insectInfo.imageUrl || '';
            if (!imageUrl) {
              // 首先检查是否有预设的图片URL - 完整的昆虫图片映射表
              const insectImageUrls = {
                '眼斑螳螂': 'https://img.alicdn.com/imgextra/i4/O1CN01aZxGmz1e0XyF5YjH3_!!6000000003688-0-lubanu.jpg',
                '步甲幼虫': 'https://t7.baidu.com/it/u=110131899,2058617435&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
                '地鳖': 'https://t7.baidu.com/it/u=4221003161,3077827695&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=300',
                '蝴蝶': 'https://t7.baidu.com/it/u=1935592311,2578343870&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=313',
                '蜜蜂': 'https://t7.baidu.com/it/u=1464345686,3372357833&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '蚂蚁': 'https://t7.baidu.com/it/u=248068639,3395915469&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '蜻蜓': 'https://t7.baidu.com/it/u=1029684111,3681641525&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '变色树蜥': 'https://t7.baidu.com/it/u=2510668569,1048315846&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
                '牡丹鹦鹉': 'https://t7.baidu.com/it/u=3106284192,2244210758&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '幽灵螳螂': 'https://img.alicdn.com/imgextra/i3/O1CN0189y3p21wYd9Z3eZfF_!!6000000006304-0-lubanu.jpg',
                '蓝舌石龙子': 'https://t7.baidu.com/it/u=3492912072,1938507263&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '中华大扁锹': 'https://t7.baidu.com/it/u=3844553548,4158186390&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '蓝孔雀': 'https://t7.baidu.com/it/u=3147262123,3512128692&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '姬兜': 'https://img.alicdn.com/imgextra/i4/O1CN01h1r3F51lB1nYl1e0X_!!6000000003687-0-lubanu.jpg',
                '苏里南潜螈': 'https://t7.baidu.com/it/u=2972312196,4043054125&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
                '锹甲': 'https://t7.baidu.com/it/u=684608629,1384084554&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '独角仙': 'https://t7.baidu.com/it/u=3232388974,4185695270&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '金龟子': 'https://t7.baidu.com/it/u=63005150,4268008290&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '七星瓢虫': 'https://t7.baidu.com/it/u=2212768863,2819402725&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
                '竹节虫': 'https://t7.baidu.com/it/u=2196846743,1424808283&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '大刀螳螂': 'https://t7.baidu.com/it/u=419223625,4051093778&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
                '蓝闪蝶': 'https://t7.baidu.com/it/u=2930998125,3192395985&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333'
              };
              
              // 尝试使用预设的图片URL - 不区分大小写
              const insectNameLower = userInsect.name.toLowerCase();
              let found = false;
              for (const [key, value] of Object.entries(insectImageUrls)) {
                if (key.toLowerCase() === insectNameLower) {
                  imageUrl = value;
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                // 最后使用本地默认图片
                imageUrl = '/images/default_insect.png';
              }
            }
            
            // 判断是否为新发现的昆虫（24小时内）
            const now = new Date().getTime();
            const lastFoundTime = userInsect.lastFoundTime ? new Date(userInsect.lastFoundTime).getTime() : 0;
            const isNew = now - lastFoundTime < 24 * 60 * 60 * 1000; // 24小时内的视为新发现
            
            return {
              id: userInsect.insectId,
              name: userInsect.name,
              foundCount: foundCount,
              imageUrl: imageUrl,
              lastFoundTime: userInsect.lastFoundTime,
              isNew: isNew
            };
          });
          
          // 保存最终的昆虫数据到本地缓存
          wx.setStorageSync('recent_insects', recentInsects);
          
          this.setData({
            recentInsects: recentInsects
          });
          // 更新用户等级信息
          this.updateUserLevel();
        });
      } else {
        this.setData({
          recentInsects: []
        });
      }
    }).catch(err => {
      console.error('加载数据失败:', err);
      
      // 尝试使用本地缓存数据作为后备
      const cachedUserInsects = wx.getStorageSync('user_insects_list') || [];
      const cachedRecentInsects = wx.getStorageSync('recent_insects') || [];
      const cachedCollectedCount = wx.getStorageSync('collectedCount') || 0;
      
      if (cachedRecentInsects.length > 0) {
        console.log('使用本地缓存数据作为后备，数量:', cachedRecentInsects.length);
        this.setData({
          recentInsects: cachedRecentInsects,
          collectedCount: cachedCollectedCount
        });
      } else {
        wx.showToast({
          title: '加载失败，请检查网络连接',
          icon: 'none'
        });
      }
      
      // 即使出错也更新等级信息
      this.updateUserLevel();
    });
  },

  // 跳转到拍照页面
  goToCamera: function() {
    wx.switchTab({
      url: '/pages/camera/camera'
    });
  },
  
  // 跳转到徽章详情页面
  goToBadges: function() {
    wx.navigateTo({
      url: '/pages/badges/badges'
    });
  },
  
  // 更新用户等级信息
  updateUserLevel: function() {
    // 等级规则：临时设定的等级门槛
    // Lv.1 昆虫萌新: 1种
    // Lv.2 昆虫探索者: 5种
    // Lv.5 好奇观察者: 15种
    // Lv.15 田野侦探: 30种
    // Lv.30 昆虫爱好者: 50种
    const collectedCount = this.data.collectedCount;
    let level = 1;
    let name = '昆虫萌新';
    let icon = '/images/icons/bug1.svg';
    let progress = '1/15';
    let nextLevelCount = 15;
    
    if (collectedCount >= 15) {
      level = 5;
      name = '好奇观察者';
      icon = '/images/icons/bug2.svg';
      progress = '15/15';
      nextLevelCount = 30;
    } else if (collectedCount >= 5) {
      level = 2;
      name = '昆虫探索者';
      icon = '/images/icons/bug1.svg';
      progress = `${collectedCount}/15`;
    } else if (collectedCount > 1) {
      level = 2;
      name = '昆虫探索者';
      icon = '/images/icons/bug1.svg';
      progress = `${collectedCount}/15`;
    }
    
    // 如果已经达到更高等级
    if (collectedCount >= 30) {
      level = 15;
      name = '田野侦探';
      icon = '/images/icons/bug3.svg';
      progress = '30/30';
      nextLevelCount = 50;
    }
    
    if (collectedCount >= 50) {
      level = 30;
      name = '昆虫爱好者';
      icon = '/images/icons/bug4.svg';
      progress = '50/50';
      nextLevelCount = 50; // 最高等级
    }
    
    // 更新等级信息，为后续调整预留空间
    this.setData({
      currentBadge: {
        level,
        name,
        icon,
        progress: collectedCount >= nextLevelCount ? `${collectedCount}/${collectedCount}` : `${collectedCount}/${nextLevelCount}`
      }
    });
  },

  // 增强的图片加载失败处理
  onImageError: function(e) {
    console.log('昆虫图片加载失败:', e);
    const index = e.currentTarget.dataset.index;
    const recentInsects = this.data.recentInsects;
    
    if (recentInsects && recentInsects[index]) {
      const insectName = recentInsects[index].name;
      const currentImageUrl = recentInsects[index].imageUrl;
      const defaultImageUrl = '/images/empty_insect.png'; // 使用灰态LOGO作为默认图
      
      // 创建副本以避免直接修改原数据
      const updatedInsects = [...recentInsects];
      
      // 首先尝试使用本地默认图片
      if (currentImageUrl !== defaultImageUrl) {
        console.log(`为昆虫 ${insectName} (索引: ${index}) 设置灰态LOGO`);
        updatedInsects[index] = {
          ...updatedInsects[index],
          imageUrl: defaultImageUrl,
          imageLoadStatus: 'default'
        };
        
        this.setData({
          recentInsects: updatedInsects
        });
      }
      
      // 同时在后台尝试重新获取图片信息，提高用户体验
      this.tryToReloadImage(insectName, index);
    }
  },
  
  // 尝试重新加载图片信息
  tryToReloadImage: function(insectName, index) {
    console.log(`尝试为昆虫 ${insectName} 重新加载图片信息`);
    
    // 1. 从本地预设的图片URL映射表中查找备用图片
    const insectImageUrls = {
      '眼斑螳螂': 'https://img.alicdn.com/imgextra/i4/O1CN01aZxGmz1e0XyF5YjH3_!!6000000003688-0-lubanu.jpg',
      '红珠凤蝶蛹': 'https://t7.baidu.com/it/u=228423286,3138567427&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
      '步甲幼虫': 'https://img.alicdn.com/imgextra/i3/O1CN01rO2WdQ1X5H9vZJXo0_!!6000000002730-0-lubanu.jpg',
      '地鳖': 'https://img.alicdn.com/imgextra/i2/O1CN019hN6hQ1F7O9gG2y5Q_!!6000000000556-0-lubanu.jpg',
      '蝴蝶': 'https://img.alicdn.com/imgextra/i2/O1CN01h7C1nL1f6Q3V2p4Ov_!!6000000003927-0-lubanu.jpg',
      '蜜蜂': 'https://img.alicdn.com/imgextra/i1/O1CN01z2tQ9t1bZg6fE5L3C_!!6000000003886-0-lubanu.jpg',
      '蚂蚁': 'https://img.alicdn.com/imgextra/i2/O1CN01KzO8nD1NQ4W7MfX4Y_!!6000000001886-0-lubanu.jpg',
      '蜻蜓': 'https://img.alicdn.com/imgextra/i1/O1CN01M0CXuq1nJZ0Fd0o95_!!6000000005314-0-lubanu.jpg',
      '变色树蜥': 'https://img.alicdn.com/imgextra/i4/O1CN01pJzrB61kPv7K1fXlE_!!6000000004453-0-lubanu.jpg',
      '牡丹鹦鹉': 'https://img.alicdn.com/imgextra/i3/O1CN01Qx6JnX1nXn8Q3S42y_!!6000000005175-0-lubanu.jpg',
      '幽灵螳螂': 'https://img.alicdn.com/imgextra/i3/O1CN0189y3p21wYd9Z3eZfF_!!6000000006304-0-lubanu.jpg',
      '蓝舌石龙子': 'https://img.alicdn.com/imgextra/i3/O1CN01fSg40P1iT3WtX7n35_!!6000000004345-0-lubanu.jpg',
      '中华大扁锹': 'https://img.alicdn.com/imgextra/i3/O1CN01Z1J3l91P2P2g8JwXg_!!6000000000601-0-lubanu.jpg',
      '蓝孔雀': 'https://img.alicdn.com/imgextra/i4/O1CN01lB1nYl1e0XyD8jC6r_!!6000000003689-0-lubanu.jpg',
      '姬兜': 'https://img.alicdn.com/imgextra/i4/O1CN01h1r3F51lB1nYl1e0X_!!6000000003687-0-lubanu.jpg',
      '苏里南潜螈': 'https://img.alicdn.com/imgextra/i1/O1CN01zV0lXo1pUq8g4jFmE_!!6000000005502-0-lubanu.jpg',
      '锹甲': 'https://img.alicdn.com/imgextra/i2/O1CN01H2M1Wz1Q1d1m5n1p2_!!6000000001204-0-lubanu.jpg',
      '独角仙': 'https://img.alicdn.com/imgextra/i4/O1CN01BjW1gQ1zRQ8KZ0gHc_!!6000000006779-0-lubanu.jpg',
      '金龟子': 'https://img.alicdn.com/imgextra/i1/O1CN01jO4I5s1zZ9Q9k3e7N_!!6000000006362-0-lubanu.jpg',
      '七星瓢虫': 'https://img.alicdn.com/imgextra/i3/O1CN01YxqKbE1zK0I1W0Y0J_!!6000000006780-0-lubanu.jpg',
      '竹节虫': 'https://img.alicdn.com/imgextra/i4/O1CN01tLk27p1tN9KQ7V0yq_!!6000000005940-0-lubanu.jpg',
      '大刀螳螂': 'https://img.alicdn.com/imgextra/i1/O1CN01JkXy8S1rE7H1vL1p9_!!6000000005911-0-lubanu.jpg',
      '蓝闪蝶': 'https://img.alicdn.com/imgextra/i1/O1CN01rUQ6uI1rPZ1K5o5fZ_!!6000000005029-0-lubanu.jpg'
    };
    
    // 检查是否有备用图片URL
    const insectNameLower = insectName.toLowerCase();
    let alternativeUrl = null;
    
    for (const [key, value] of Object.entries(insectImageUrls)) {
      if (key.toLowerCase() === insectNameLower) {
        alternativeUrl = value;
        break;
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
            const recentInsects = this.data.recentInsects;
            if (recentInsects && recentInsects[index]) {
              const updatedInsects = [...recentInsects];
              updatedInsects[index] = {
                ...updatedInsects[index],
                imageUrl: alternativeUrl,
                imageLoadStatus: 'success'
              };
              
              this.setData({
                recentInsects: updatedInsects
              });
            }
          }
        });
      }, 1000);
    }
    
    // 同时从数据库获取最新图片信息，作为第二道保障
    this.fetchImageFromDatabase(insectName, index);
  },
  
  // 验证图片URL是否有效
  validateImageUrl: function(url, callback) {
    // 创建一个临时的图片对象来验证URL
    const img = new Image();
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
  fetchImageFromDatabase: function(insectName, index) {
    const db = wx.cloud.database();
    
    // 查找昆虫信息
    db.collection('insects')
      .where({
        name: insectName
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const insectInfo = res.data[0];
          if (insectInfo.imageUrl) {
            console.log(`从数据库获取到昆虫 ${insectName} 的图片URL`);
            
            // 验证从数据库获取的URL
            this.validateImageUrl(insectInfo.imageUrl, (isValid) => {
              if (isValid) {
                const recentInsects = this.data.recentInsects;
                if (recentInsects && recentInsects[index]) {
                  const updatedInsects = [...recentInsects];
                  updatedInsects[index] = {
                    ...updatedInsects[index],
                    imageUrl: insectInfo.imageUrl,
                    imageLoadStatus: 'success'
                  };
                  
                  this.setData({
                    recentInsects: updatedInsects
                  });
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
  
  // 跳转到昆虫详情页 - 增加传递图片URL参数
      goToInsectDetail: function(e) {
        const insectId = e.currentTarget.dataset.id;
        const index = e.currentTarget.dataset.index;
        const recentInsects = this.data.recentInsects;
    
    // 尝试获取昆虫的图片URL
    let imageUrl = '';
    if (recentInsects && recentInsects[index]) {
      imageUrl = recentInsects[index].imageUrl || '';
    }
    
    // 构建带图片URL的跳转参数
    let url = `/pages/insect-detail/insect-detail?id=${insectId}`;
    if (imageUrl) {
      url += `&imageUrl=${encodeURIComponent(imageUrl)}`;
    }
    
    wx.navigateTo({
      url: url
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadUserData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },
  
  // 页面初次渲染完成
  onReady: function() {
    // 页面渲染完成后，触发图片自动补齐功能
    this.checkAndLoadMissingImages();
  },

  // 处理昆虫记录长按事件，实现删除功能
  onInsectLongPress: function(e) {
    const insectId = e.currentTarget.dataset.id;
    const insectName = e.currentTarget.dataset.name;
    const index = e.currentTarget.dataset.index;
    
    console.log(`长按昆虫记录: ${insectName}, ID: ${insectId}`);
    
    // 显示二次确认对话框
    wx.showModal({
      title: '删除确认',
      content: `确定要删除"${insectName}"的记录吗？删除后不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          console.log(`用户确认删除昆虫: ${insectName}, ID: ${insectId}`);
          
          // 调用云函数删除用户昆虫记录
          wx.cloud.callFunction({
            name: 'markFound',
            data: {
              name: insectName,
              action: 'delete',
              insectId: insectId
            },
            success: (res) => {
              console.log(`删除昆虫记录成功: ${insectName}`, res);
              
              // 从本地数据中移除该记录
              const updatedInsects = this.data.recentInsects.filter((_, i) => i !== index);
              this.setData({
                recentInsects: updatedInsects
              });
              
              // 重要修复：删除成功后彻底清除对应的本地缓存，防止记录重新出现和发现次数错误
          // 1. 清除发现次数缓存
          const localFoundCountCache = wx.getStorageSync('insectFoundCountCache') || {};
          // 彻底删除所有可能的缓存键（按ID和名称）
          delete localFoundCountCache[insectId];
          delete localFoundCountCache[insectName];
          // 额外的保护：清除所有与该昆虫名称相关的缓存键
          Object.keys(localFoundCountCache).forEach(key => {
            if (key.includes(insectName)) {
              delete localFoundCountCache[key];
            }
          });
          wx.setStorageSync('insectFoundCountCache', localFoundCountCache);
          console.log(`已彻底清除昆虫 ${insectName} 的本地发现次数缓存`);
          
          // 2. 清除详情页的完整缓存（多种可能的缓存键格式）
          const detailCacheKey = `insect_detail_${insectId}`;
          wx.removeStorageSync(detailCacheKey);
          console.log(`已清除昆虫 ${insectName} 的详情页缓存(ID格式)`);
          
          // 3. 清除按名称缓存的详情页数据
          const nameCacheKey = `insect_detail_${insectName}`;
          wx.removeStorageSync(nameCacheKey);
          console.log(`已清除昆虫 ${insectName} 的详情页缓存(名称格式)`);
          
          // 4. 清除标准化名称格式的缓存
          const normalizedName = insectName.trim().toLowerCase();
          const normalizedCacheKey = `insect_detail_${normalizedName}`;
          wx.removeStorageSync(normalizedCacheKey);
          console.log(`已清除昆虫 ${insectName} 的标准化名称详情页缓存`);
          
          // 5. 清除所有可能包含昆虫名称的缓存键
          try {
            // 获取所有存储的键
            const storageInfo = wx.getStorageInfoSync();
            storageInfo.keys.forEach(key => {
              if (key.includes('insect_detail_') && 
                  (key.includes(insectId) || key.includes(insectName) || 
                   key.includes(normalizedName))) {
                wx.removeStorageSync(key);
                console.log(`已清除匹配的缓存键: ${key}`);
              }
            });
          } catch (e) {
            console.error('遍历存储键时出错:', e);
          }
          

          
          // 立即重新加载用户数据，确保删除后收集进度实时更新
          this.loadUserData();
          
          // 显示删除成功提示
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
            },
            fail: (err) => {
              console.error(`删除昆虫记录失败: ${insectName}`, err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        } else if (res.cancel) {
          console.log(`用户取消删除昆虫: ${insectName}`);
        }
      }
    });
  },

  // 图片自动补齐功能 - 检查并尝试加载未显示的图片
  checkAndLoadMissingImages: function() {
    console.log('开始检查并加载缺失的图片');
    // 延迟执行，确保页面已经渲染完成
    setTimeout(() => {
      const { recentInsects } = this.data;
      let hasMissingImages = false;
      
      // 昆虫预设图片URL映射表 - 与详情页保持一致
    const insectImageUrls = {
      '眼斑螳螂': 'https://img.alicdn.com/imgextra/i4/O1CN01aZxGmz1e0XyF5YjH3_!!6000000003688-0-lubanu.jpg',
      '红珠凤蝶蛹': 'https://t7.baidu.com/it/u=228423286,3138567427&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
      '步甲幼虫': 'https://img.alicdn.com/imgextra/i3/O1CN01rO2WdQ1X5H9vZJXo0_!!6000000002730-0-lubanu.jpg',
      '地鳖': 'https://img.alicdn.com/imgextra/i2/O1CN019hN6hQ1F7O9gG2y5Q_!!6000000000556-0-lubanu.jpg',
      '蝴蝶': 'https://img.alicdn.com/imgextra/i2/O1CN01h7C1nL1f6Q3V2p4Ov_!!6000000003927-0-lubanu.jpg',
      '蜜蜂': 'https://img.alicdn.com/imgextra/i1/O1CN01z2tQ9t1bZg6fE5L3C_!!6000000003886-0-lubanu.jpg',
      '蚂蚁': 'https://img.alicdn.com/imgextra/i2/O1CN01KzO8nD1NQ4W7MfX4Y_!!6000000001886-0-lubanu.jpg',
      '蜻蜓': 'https://img.alicdn.com/imgextra/i1/O1CN01M0CXuq1nJZ0Fd0o95_!!6000000005314-0-lubanu.jpg',
      '变色树蜥': 'https://img.alicdn.com/imgextra/i4/O1CN01pJzrB61kPv7K1fXlE_!!6000000004453-0-lubanu.jpg',
      '牡丹鹦鹉': 'https://img.alicdn.com/imgextra/i3/O1CN01Qx6JnX1nXn8Q3S42y_!!6000000005175-0-lubanu.jpg',
      '幽灵螳螂': 'https://img.alicdn.com/imgextra/i3/O1CN0189y3p21wYd9Z3eZfF_!!6000000006304-0-lubanu.jpg',
      '蓝舌石龙子': 'https://img.alicdn.com/imgextra/i3/O1CN01fSg40P1iT3WtX7n35_!!6000000004345-0-lubanu.jpg',
      '中华大扁锹': 'https://img.alicdn.com/imgextra/i3/O1CN01Z1J3l91P2P2g8JwXg_!!6000000000601-0-lubanu.jpg',
      '蓝孔雀': 'https://img.alicdn.com/imgextra/i4/O1CN01lB1nYl1e0XyD8jC6r_!!6000000003689-0-lubanu.jpg',
      '姬兜': 'https://img.alicdn.com/imgextra/i4/O1CN01h1r3F51lB1nYl1e0X_!!6000000003687-0-lubanu.jpg',
      '苏里南潜螈': 'https://img.alicdn.com/imgextra/i1/O1CN01zV0lXo1pUq8g4jFmE_!!6000000005502-0-lubanu.jpg',
        '锹甲': 'https://img.alicdn.com/imgextra/i2/O1CN01H2M1Wz1Q1d1m5n1p2_!!6000000001204-0-lubanu.jpg',
        '独角仙': 'https://img.alicdn.com/imgextra/i4/O1CN01BjW1gQ1zRQ8KZ0gHc_!!6000000006779-0-lubanu.jpg',
        '金龟子': 'https://img.alicdn.com/imgextra/i1/O1CN01jO4I5s1zZ9Q9k3e7N_!!6000000006362-0-lubanu.jpg',
        '七星瓢虫': 'https://img.alicdn.com/imgextra/i3/O1CN01YxqKbE1zK0I1W0Y0J_!!6000000006780-0-lubanu.jpg',
        '竹节虫': 'https://img.alicdn.com/imgextra/i4/O1CN01tLk27p1tN9KQ7V0yq_!!6000000005940-0-lubanu.jpg',
        '大刀螳螂': 'https://img.alicdn.com/imgextra/i1/O1CN01JkXy8S1rE7H1vL1p9_!!6000000005911-0-lubanu.jpg',
        '蓝闪蝶': 'https://img.alicdn.com/imgextra/i1/O1CN01rUQ6uI1rPZ1K5o5fZ_!!6000000005029-0-lubanu.jpg'
      };
      
      // 检查并更新图片，不区分大小写
      const updatedInsects = filteredInsects.map(insect => {
        console.log(`[图片调试] 检查昆虫图片: ${insect.name}, 当前URL: ${insect.imageUrl}`);
        
        // 为昆虫添加图片加载状态标记
        const insectWithStatus = { ...insect, imageLoadStatus: insect.imageLoadStatus || 'unknown' };
        
        // 检查图片URL是否为空、使用默认图片或者格式不正确
        if (!insectWithStatus.imageUrl || 
            insectWithStatus.imageUrl === '/images/empty_insect.png' || 
            !(insectWithStatus.imageUrl.startsWith('http') || insectWithStatus.imageUrl.startsWith('/'))) {
          console.log(`[图片调试] ${insectWithStatus.name} 图片URL需要更新，当前状态: ${insectWithStatus.imageLoadStatus}`);
          hasMissingImages = true;
          
          // 1. 尝试使用预设图片URL
          const insectNameLower = insectWithStatus.name.toLowerCase();
          for (const [key, value] of Object.entries(insectImageUrls)) {
            if (key.toLowerCase() === insectNameLower) {
              console.log(`为 ${insectWithStatus.name} 找到预设图片URL: ${value}`);
              return { ...insectWithStatus, imageUrl: value, imageLoadStatus: 'preset' };
            }
          }
          
          // 2. 如果没有找到预设图片，尝试使用默认图片
          console.log(`为 ${insectWithStatus.name} 设置灰态LOGO`);
          return { ...insectWithStatus, imageUrl: '/images/empty_insect.png', imageLoadStatus: 'default' };
        }
        
        return insectWithStatus;
      });
      
      // 如果有更新，设置新数据
      let hasUpdates = false;
      for (let i = 0; i < filteredInsects.length; i++) {
        if (filteredInsects[i].imageUrl !== updatedInsects[i].imageUrl) {
          hasUpdates = true;
          console.log(`[图片调试] 更新昆虫 ${filteredInsects[i].name} 的图片URL，从: ${filteredInsects[i].imageUrl} 到: ${updatedInsects[i].imageUrl}`);
          break;
        }
      }
      
      if (hasUpdates) {
        console.log('有图片URL更新，应用新数据');
        this.setData({ recentInsects: updatedInsects });
      } else if (hasMissingImages) {
        // 如果仍有缺失图片，尝试从数据库重新获取
        console.log('仍有缺失图片，尝试从数据库重新获取图片信息');
        const db = wx.cloud.database();
        const _ = db.command;
        
        // 获取所有昆虫的ID (仅包含未删除的)
        const insectIds = filteredInsects.map(item => item.id);
        
        // 从数据库重新获取昆虫信息
        db.collection('insects')
          .where({
            _id: _.in(insectIds)
          })
          .get()
          .then(res => {
            if (res.data.length > 0) {
              // 创建昆虫信息映射
              const insectMap = {};
              res.data.forEach(insect => {
                insectMap[insect._id] = insect;
              });
              
              // 再次更新图片信息
          const dbUpdatedInsects = [...updatedInsects];
          let dbHasUpdates = false;
          
          console.log(`[图片调试] 从数据库获取到 ${res.data.length} 条昆虫信息`);
          
          for (let i = 0; i < dbUpdatedInsects.length; i++) {
            const dbInsect = insectMap[dbUpdatedInsects[i].id];
            if (dbInsect && dbInsect.imageUrl && dbInsect.imageUrl !== dbUpdatedInsects[i].imageUrl) {
              dbUpdatedInsects[i] = { ...dbUpdatedInsects[i], imageUrl: dbInsect.imageUrl };
              dbHasUpdates = true;
              console.log(`[图片调试] 从数据库更新昆虫 ${dbUpdatedInsects[i].name} 的图片URL，从: ${dbUpdatedInsects[i].imageUrl} 到: ${dbInsect.imageUrl}`);
            }
          }
              
              if (dbHasUpdates) {
                this.setData({ recentInsects: dbUpdatedInsects });
              }
            }
          })
          .catch(err => {
            console.error('重新加载图片信息失败:', err);
          });
      }
      
      console.log('图片检查和加载完成');
    }, 1500); // 1.5秒延迟，确保页面渲染完成
  }
});