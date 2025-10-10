// pages/camera/camera.js
const app = getApp();

// 昆虫类型建议列表
const INSECT_SUGGESTIONS = [
  '眼斑螳螂', '枯叶螳螂', '大刀螳螂', '中华螳螂',
  '蜜蜂', '胡蜂', '熊蜂', 
  '蝴蝶', '蛾', '蜻蜓', '豆娘',
  '蚂蚁', '蟋蟀', '蝗虫', '螽斯',
  '甲虫', '瓢虫', '天牛', '金龟子',
  '蝉', '蚱蝉', '蟪蛄',
  '地鳖', '蟑螂', '蠼螋', '蜈蚣'
];

Page({
  data: {
    hasResult: false,
    tempImagePath: '',
    recognitionResults: [],
    selectedIndex: 0,
    isSaving: false,
    isRecognizing: false,
    showManualInput: false,
    manualInsectName: '',
    isNotAnimal: false,
    saveError: '',
    scale: 1,
    lastScale: 1,
    touchPoints: 0,
    imageWidth: 0,
    imageHeight: 0,
    initialDistance: 0,
    imagePosition: { x: 0, y: 0 },
    startX: 0,
    startY: 0,
    previewWidth: 0,
    previewHeight: 0,
    cameraEnabled: false
  },

  // 启用相机
  enableCamera: function() {
    this.setData({ cameraEnabled: true });
  },

  // 拍照
  takePhoto: function() {
    if (!this.data.cameraEnabled) {
      this.enableCamera();
      return;
    }
    const ctx = wx.createCameraContext();
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          tempImagePath: res.tempImagePath,
          hasResult: true,
          scale: 1
        });
        this.recognizeInsect(res.tempImagePath);
      }
    });
  },

  // 从相册选择图片
  chooseImage: function() {
    // 从相册选择不需要启用相机
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          tempImagePath: res.tempFilePaths[0],
          hasResult: true,
          scale: 1
        });
        this.recognizeInsect(res.tempFilePaths[0]);
      }
    });
  },

  // 识别昆虫
  recognizeInsect: function(filePath) {
    this.setData({
      isRecognizing: true
    });
    
    wx.showLoading({
      title: '识别中...',
      mask: true
    });
    
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const imageBase64 = res.data;
        
        wx.cloud.callFunction({
          name: 'calliNat',
          data: {
            imageBase64: imageBase64
          },
          success: (res) => {
            wx.hideLoading();
            this.setData({ isRecognizing: false });
            
            if (res.result && res.result.success) {
              const results = res.result.data;
              const isNotAnimal = results.length === 0;
              
              this.setData({
                recognitionResults: results,
                selectedIndex: 0,
                isNotAnimal: isNotAnimal
              });
              
              if (isNotAnimal) {
                wx.showToast({
                  title: '未识别到昆虫',
                  icon: 'none'
                });
              }
            } else {
              wx.showToast({
                title: res.result.message || '识别失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            this.setData({ isRecognizing: false });
            
            console.error('调用识别服务失败:', err);
            wx.showToast({
              title: '识别服务超时，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isRecognizing: false });
        
        wx.showToast({
          title: '图片处理失败',
          icon: 'none'
        });
      }
    });
  },

  // 手动输入功能
  showManualInputDialog: function() {
    this.setData({
      showManualInput: true,
      showSuggestions: true,
      manualInsectName: ''
    });
  },

  hideManualInputDialog: function() {
    this.setData({
      showManualInput: false,
      showSuggestions: false,
      manualInsectName: ''
    });
  },

  onManualInputChange: function(e) {
    const value = e.detail.value;
    this.setData({
      manualInsectName: value,
      showSuggestions: value.length > 0
    });
  },

  // 选择建议
  selectSuggestion: function(e) {
    const name = e.currentTarget.dataset.name;
    this.setData({
      manualInsectName: name,
      showSuggestions: false
    });
  },

  onManualInputConfirm: function() {
    const name = this.data.manualInsectName.trim();
    if (!name) return;

    this.hideManualInputDialog();
    
    const manualResult = {
      name: name,
      score: 0.95,
      scorePercent: '95.0',
      category: '用户指定',
      baike_info: {
        classname: '用户指定',
        description: '用户手动输入的昆虫种类'
      }
    };

    this.setData({
      recognitionResults: [manualResult],
      selectedIndex: 0,
      isNotAnimal: false
    });
  },

  // 选择识别结果
  selectResult: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedIndex: index
    });
  },

  // 确认选择并记录
  confirmSelection: function() {
    if (this.data.recognitionResults.length === 0) return;
    
    this.setData({
      isSaving: true,
      saveError: ''
    });
    
    const selectedResult = this.data.recognitionResults[this.data.selectedIndex];
    
    console.log('开始保存昆虫:', selectedResult.name);
    
    // 移除昆虫验证逻辑，让用户可以添加任何识别结果
    
    const insectName = selectedResult.name;
    
    // 额外重要修复：在保存昆虫前，主动清除该昆虫的所有相关缓存
    // 确保重新添加的昆虫不会受到历史缓存的影响
    try {
      // 1. 清除发现次数缓存
      const localFoundCountCache = wx.getStorageSync('insectFoundCountCache') || {};
      const normalizedName = insectName.trim();
      const normalizedNameLower = normalizedName.toLowerCase();
      
      // 清除所有可能的缓存键
      Object.keys(localFoundCountCache).forEach(key => {
        if (key === insectName || key.toLowerCase() === normalizedNameLower || key.includes(insectName)) {
          delete localFoundCountCache[key];
          console.log(`清除发现次数缓存键: ${key}`);
        }
      });
      
      wx.setStorageSync('insectFoundCountCache', localFoundCountCache);
      console.log(`已主动清除昆虫"${insectName}"的所有发现次数缓存`);
      
      // 2. 清除详情页缓存 - 重要修复：确保清除所有相关缓存
      const storageInfo = wx.getStorageInfoSync();
      
      // 生成统一的昆虫ID，使用与云函数一致的方法
      const normalizedInsectName = this.normalizeInsectName(insectName);
      const unifiedInsectId = this.generateInsectId(insectName);
      
      storageInfo.keys.forEach(key => {
        // 不仅检查名称，还要检查昆虫ID
        if (key.includes('insect_detail_') && 
            (key.includes(insectName) || 
             key.includes(normalizedName) || 
             key.includes(normalizedInsectName) ||
             key.includes(unifiedInsectId))) {
          wx.removeStorageSync(key);
          console.log(`清除详情页缓存键: ${key}`);
        }
      });
      
      console.log(`已主动清除昆虫"${insectName}"的所有详情页缓存，包含名称和统一ID的缓存键`);
      
      console.log(`已主动清除昆虫"${insectName}"的所有详情页缓存，包含名称和统一ID的缓存键`);
    } catch (e) {
      console.error('清除缓存时出错:', e);
    }
    
    // 上传用户拍摄的图片到云存储
    wx.cloud.uploadFile({
      cloudPath: `insects/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`,
      filePath: this.data.tempImagePath,
      success: (uploadRes) => {
        console.log('图片上传成功:', uploadRes.fileID);
        
        // 调用云函数保存（不再自己生成ID，由云函数统一处理）
        wx.cloud.callFunction({
          name: 'markFound',
          data: {
            name: selectedResult.name,
            baikeInfo: selectedResult.baike_info || {},
            // 重要：通过拍照/上传照片识别并确认发现时，明确标记为新发现
            isNewDiscovery: true,
            // 传递用户拍摄的图片URL
            userImageUrl: uploadRes.fileID
          },
          success: (res) => {
        console.log('云函数返回:', res);
        
        const result = res.result || {};
        
        this.setData({
          isSaving: false
        });
        
        if (result.success) {
          let message = '昆虫记录保存成功';
          
          wx.showToast({
            title: message,
            icon: 'success',
            duration: 2000
          });
          
          // 重要修复：设置全局标记，告知首页需要刷新数据
          const app = getApp();
          app.globalData.needRefreshHomePage = true;
          app.globalData.fromCameraPage = true; // 同时设置这个标记，以防用户直接从其他地方进入详情页
          
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 2000);
        } else {
          this.setData({
            saveError: result.message || '保存失败'
          });
          wx.showToast({
            title: result.message || '保存失败',
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        console.error('调用云函数失败:', err);
        this.setData({
          isSaving: false,
          saveError: '网络错误: ' + (err.errMsg || '未知错误')
        });
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 3000
        });
      }
    });
      },
      fail: (uploadErr) => {
        console.error('图片上传失败:', uploadErr);
        this.setData({
          isSaving: false,
          saveError: '图片上传失败'
        });
        wx.showToast({
          title: '图片上传失败，请重试',
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 生成统一的昆虫ID（与云函数保持一致）
  generateInsectId: function(name) {
    const normalizedName = this.normalizeInsectName(name);
    // 只使用标准化名称生成ID，不添加时间戳，与云函数保持一致
    return normalizedName.replace(/[^a-zA-Z0-9一-龥]/g, '');
  },
  
  // 标准化昆虫名称（与云函数保持一致）
  normalizeInsectName: function(name) {
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
    return INSECT_NAME_MAP[name] || name;
  },

  // 图片加载完成
  imageLoad: function(e) {
    console.log('图片加载完成:', e.detail);
    this.setData({
      imageWidth: e.detail.width,
      imageHeight: e.detail.height,
      scale: 1,
      // 设置预览区域尺寸
      previewWidth: 750, // 假设屏幕宽度为750rpx
      previewHeight: 500 // 预览区域高度固定为500rpx
    });
  },

  // 识别框内区域 - 已被移除，保留函数防止引用错误
  recognizeSelectedArea: function() {
    this.recognizeAgain();
  },

  // 图片加载失败
  imageError: function(e) {
    console.error('图片加载失败:', e.detail);
    wx.showToast({
      title: '图片加载失败',
      icon: 'none'
    });
  },

  // 初始化节流定时器
  lastTouchMoveTime: 0,
  touchMoveDebounceTimer: null,
  
  // 长按相关状态
  isLongPress: false,
  longPressTimer: null,
  
  // 触摸开始事件
  touchStart: function(e) {
    // 清除之前的长按定时器
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    if (e.touches.length === 2) {
      this.setData({
        touchPoints: 2,
        lastScale: this.data.scale
      });
    } else if (e.touches.length === 1) {
      this.setData({
        touchPoints: 1,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY
      });
      
      // 设置长按检测定时器
      const that = this;
      this.longPressTimer = setTimeout(function() {
        that.isLongPress = true;
      }, 350); // 350ms为长按阈值
    }
  },
  
  // 触摸移动事件（用于缩放和移动）
  touchMove: function(e) {
    // 取消长按检测
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // 使用节流优化减少频繁更新导致的页面闪动
    const currentTime = new Date().getTime();
    if (this.lastTouchMoveTime && (currentTime - this.lastTouchMoveTime) < 16) { // 约60fps
      return;
    }
    this.lastTouchMoveTime = currentTime;
    
    // 双指缩放逻辑
    if (e.touches.length === 2) {
      // 确保touchPoints设置正确
      if (this.data.touchPoints !== 2) {
        this.setData({
          touchPoints: 2,
          lastScale: this.data.scale,
          initialDistance: 0
        });
        return;
      }
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // 计算两指之间的距离
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (this.data.initialDistance === 0) {
        // 记录初始距离
        this.setData({
          initialDistance: distance
        });
      } else {
        // 计算缩放比例
        const scale = (distance / this.data.initialDistance) * this.data.lastScale;
        // 增加缩放范围（0.5倍到3倍）
        const clampedScale = Math.max(0.5, Math.min(3, scale));
        
        // 只有当缩放值有明显变化时才更新，减少不必要的重绘
        if (Math.abs(clampedScale - this.data.scale) > 0.01) {
          // 直接更新，避免requestAnimationFrame可能的兼容性问题
          this.setData({
            scale: clampedScale
          });
        }
      }
    } 
    // 单指移动逻辑
    else if (e.touches.length === 1 && !this.isLongPress) {
      // 确保touchPoints设置正确
      if (this.data.touchPoints !== 1) {
        this.setData({
          touchPoints: 1
        });
        return;
      }
      
      const deltaX = e.touches[0].clientX - this.data.startX;
      const deltaY = e.touches[0].clientY - this.data.startY;
      
      // 只有当移动距离超过阈值时才处理，减少抖动
      if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
        return;
      }
      
      // 计算新位置
      let newX = this.data.imagePosition.x + deltaX;
      let newY = this.data.imagePosition.y + deltaY;
      
      // 添加边界检查，限制图片在容器范围内移动
      // 优化：只在首次需要时获取系统信息并缓存
      if (!this.systemInfo) {
        this.systemInfo = wx.getSystemInfoSync();
      }
      const containerWidth = (this.systemInfo.windowWidth * 0.92); // 考虑左右padding后的容器宽度
      const containerHeight = 500 * this.systemInfo.windowWidth / 750; // 将rpx转换为实际像素
      
      // 计算图片缩放后的尺寸
      const scaledImageWidth = this.data.imageWidth * this.data.scale;
      const scaledImageHeight = this.data.imageHeight * this.data.scale;
      
      // 计算最大可移动距离
      const maxMoveX = (scaledImageWidth - containerWidth) / 2;
      const maxMoveY = (scaledImageHeight - containerHeight) / 2;
      
      // 限制移动范围
      if (maxMoveX > 0) {
        newX = Math.max(-maxMoveX, Math.min(maxMoveX, newX));
      } else {
        newX = 0; // 如果图片比容器小，不允许移动
      }
      
      if (maxMoveY > 0) {
        newY = Math.max(-maxMoveY, Math.min(maxMoveY, newY));
      } else {
        newY = 0; // 如果图片比容器小，不允许移动
      }
      
      // 保存新的startX和startY
      const newStartX = e.touches[0].clientX;
      const newStartY = e.touches[0].clientY;
      
      // 直接更新数据，避免requestAnimationFrame可能的兼容性问题
      this.setData({
        imagePosition: { x: newX, y: newY },
        startX: newStartX,
        startY: newStartY
      });
    }
  },
  
  // 使用requestAnimationFrame进行批量更新优化
  scheduleUpdate: function(callback) {
    if (!this.updateRequest) {
      const that = this;
      this.updateRequest = wx.createAnimationFrameRequest(() => {
        callback();
        that.updateRequest = null;
      });
    }
  },

  // 触摸结束事件
  touchEnd: function(e) {
    // 清除长按定时器并重置长按状态
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    this.isLongPress = false;
    
    this.setData({
      touchPoints: 0,
      initialDistance: 0
    });
  },
  
  // 触摸取消事件处理（防止意外情况）
  touchCancel: function(e) {
    this.touchEnd(e);
  },

  // 重置，重新拍摄
  reset: function() {
    this.setData({
      hasResult: false,
      tempImagePath: '',
      recognitionResults: [],
      selectedIndex: 0,
      isSaving: false,
      isRecognizing: false,
      showManualInput: false,
      manualInsectName: '',
      isNotAnimal: false,
      saveError: '',
      scale: 1,
      touchPoints: 0,
      imagePosition: { x: 0, y: 0 }
    });
  },

  // 再次识别
  recognizeAgain: function() {
    if (this.data.tempImagePath) {
      // 重置识别相关状态，但保留图片缩放和位置状态
      this.setData({
        recognitionResults: [],
        isNotAnimal: false,
        saveError: ''
        // 不再重置scale和imagePosition，保留用户调整后的状态
      });
      // 调用识别函数
      this.recognizeInsect(this.data.tempImagePath);
    }
  }
});