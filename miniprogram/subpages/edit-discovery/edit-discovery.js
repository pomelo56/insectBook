// 昆虫发现编辑页面
const app = getApp();

Page({
  data: {
    insectId: '',          // 昆虫ID，如果是编辑现有记录
    imagePath: '',         // 昆虫图片路径
    longitude: '',         // 经度
    latitude: '',          // 纬度
    locationName: '',      // 位置名称
    showLocationInfo: false, // 是否显示位置信息
    insectName: '',        // 昆虫名称
    discoveryDate: '',     // 发现日期
    discoveryTime: '',     // 发现时间
    weather: 'sunny',      // 天气状况
    season: '',            // 季节
    notes: '',             // 观察笔记
    isRare: false,         // 是否稀有
    isLoading: false,      // 是否加载中
    loadingText: '加载中...' // 加载提示文本
  },

  onLoad: function(options) {
    console.log('Options:', options);
    
    // 设置当前日期时间为默认值
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const currentDate = `${year}-${month}-${day}`;
    const currentTime = `${hours}:${minutes}`;
    
    // 根据月份设置默认季节
    let defaultSeason = 'spring';
    const monthNum = now.getMonth() + 1;
    if (monthNum >= 3 && monthNum <= 5) {
      defaultSeason = 'spring';
    } else if (monthNum >= 6 && monthNum <= 8) {
      defaultSeason = 'summer';
    } else if (monthNum >= 9 && monthNum <= 11) {
      defaultSeason = 'autumn';
    } else {
      defaultSeason = 'winter';
    }
    
    // 设置初始数据
    this.setData({
      discoveryDate: currentDate,
      discoveryTime: currentTime,
      season: defaultSeason
    });
    
    // 如果有昆虫名称参数
    if (options.insectName) {
      this.setData({
        insectName: decodeURIComponent(options.insectName)
      });
    }
    
    // 如果有图片路径参数
    if (options.imagePath) {
      this.setData({
        imagePath: decodeURIComponent(options.imagePath)
      });
    }
    
    // 如果有位置信息
    if (options.longitude && options.latitude) {
      this.setData({
        longitude: options.longitude,
        latitude: options.latitude,
        showLocationInfo: true
      });
      
      // 逆地理编码获取位置名称
      this.getLocationName(options.longitude, options.latitude);
    }
    
    // 如果有发现日期参数，优先使用该日期
    if (options.discoveryDate) {
      this.setData({
        discoveryDate: decodeURIComponent(options.discoveryDate)
      });
    }
    
    // 如果有笔记内容参数，显示到编辑框中
    if (options.notesContent) {
      this.setData({
        notes: decodeURIComponent(options.notesContent)
      });
    }
    
    // 如果是编辑现有记录
    if (options.insectId) {
      this.setData({
        insectId: options.insectId,
        loadingText: '加载数据中...',
        isLoading: true
      });
      
      // 模拟从数据库获取数据
      this.loadInsectData(options.insectId);
    }
  },

  // 逆地理编码获取位置名称
  getLocationName: function(longitude, latitude) {
    const that = this;
    wx.request({
      url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=YOUR_MAP_KEY`,
      success: function(res) {
        if (res.data.status === 0) {
          const address = res.data.result.address_reference.landmark_l2?.title || 
                         res.data.result.address_reference.district?.title || 
                         res.data.result.address;
          that.setData({
            locationName: address
          });
        }
      },
      fail: function() {
        // 如果获取失败，显示坐标
        that.setData({
          locationName: `坐标: ${longitude}, ${latitude}`
        });
      }
    });
  },

  // 加载昆虫数据（编辑模式）
  loadInsectData: function(insectId) {
    // 模拟从数据库获取数据，但保留从昆虫详情页传递过来的实际数据
    setTimeout(() => {
      // 获取当前页面已有的数据
      const currentData = this.data;
      
      // 这里应该是从数据库获取的数据，可以根据实际需求进行合并
      // 为了演示，我们只设置isLoading为false，表示加载完成
      this.setData({
        isLoading: false
      });
    }, 1500);
  },

  // 昆虫名称输入
  onNameInput: function(e) {
    this.setData({
      insectName: e.detail.value
    });
  },

  // 发现日期输入
  onDateInput: function(e) {
    this.setData({
      discoveryDate: e.detail.value
    });
  },

  // 发现时间输入
  onTimeInput: function(e) {
    this.setData({
      discoveryTime: e.detail.value
    });
  },

  // 观察笔记输入
  onNotesInput: function(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  // 选择天气
  selectWeather: function(e) {
    const weather = e.currentTarget.dataset.weather;
    this.setData({
      weather: weather
    });
  },

  // 选择季节
  selectSeason: function(e) {
    const season = e.currentTarget.dataset.season;
    this.setData({
      season: season
    });
  },

  // 选择稀有程度
  selectRare: function(e) {
    const isRare = e.currentTarget.dataset.rare === 'true';
    this.setData({
      isRare: isRare
    });
  },

  // 保存发现记录
saveDiscovery: function() {
    console.log('===== 开始保存发现记录 =====');
    
    // 验证表单
    if (!this.data.insectName.trim()) {
      wx.showToast({
        title: '请输入昆虫名称',
        icon: 'none'
      });
      console.log('表单验证失败: 未输入昆虫名称');
      return;
    }
    
    // 如果是编辑模式，允许使用从详情页传递的图片，不强制要求重新上传
    if (!this.data.imagePath && !this.data.insectId) {
      wx.showToast({
        title: '请上传昆虫图片',
        icon: 'none'
      });
      console.log('表单验证失败: 未上传昆虫图片且非编辑模式');
      return;
    }
    
    this.setData({
      isLoading: true,
      loadingText: '保存中...'
    });
    
    // 构建保存数据
    const discoveryData = {
      name: this.data.insectName,
      image: this.data.imagePath,
      date: this.data.discoveryDate,
      time: this.data.discoveryTime,
      weather: this.data.weather,
      season: this.data.season,
      notes: this.data.notes,
      rare: this.data.isRare,
      longitude: this.data.longitude || '0',
      latitude: this.data.latitude || '0',
      locationName: this.data.locationName,
      createTime: new Date().getTime(),
      // 重要修复：根据是否是新记录来决定isNewDiscovery的值
      // 1. 如果有insectId，说明是编辑现有记录，isNewDiscovery为false
      // 2. 如果没有insectId，说明是新记录（包括重新添加已删除的昆虫），isNewDiscovery为true
      isNewDiscovery: !this.data.insectId
    };
    
    console.log('构建的保存数据:', JSON.stringify(discoveryData));
    console.log('isNewDiscovery明确设置为:', discoveryData.isNewDiscovery);
    
    // 如果是编辑模式，添加ID
    if (this.data.insectId) {
      discoveryData.id = this.data.insectId;
    }
    
    // 模拟保存到数据库
    setTimeout(() => {
      console.log('保存数据:', discoveryData);
      
      // 模拟成功保存
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 如果是新发现记录，设置全局标志以便首页可以立即显示
      if (discoveryData.isNewDiscovery) {
        // 创建简化的昆虫对象，用于首页立即显示
        const newInsect = {
          id: discoveryData.id || 'new_' + Date.now(),
          name: discoveryData.name,
          foundCount: 1,
          imageUrl: discoveryData.image || '/images/empty_insect.png',
          userImageUrl: discoveryData.image || '',
          lastFoundTime: new Date().toISOString(),
          isNew: true
        };
        
        // 设置全局标志和新昆虫信息，以便首页能够立即显示
        app.globalData.needRefreshHomePage = true;
        app.globalData.newAddedInsect = newInsect;
        console.log('设置首页刷新标志和新昆虫信息:', newInsect);
      } else {
        // 编辑模式下也需要刷新首页，但不需要立即显示特定昆虫
        app.globalData.needRefreshHomePage = true;
      }
      
      console.log('准备返回昆虫详情页并传递数据');
      
      // 在返回时传递最新的昆虫数据，以便在昆虫详情页中更新显示
      setTimeout(() => {
        // 返回上一页（昆虫详情页）
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2]; // 昆虫详情页
        
        console.log('找到上一页实例，准备传递数据');
        
        // 如果存在上一页，则调用其方法更新观察笔记
        if (prevPage) {
          // 传递发现数据回昆虫详情页
          wx.navigateBack({delta: 1, success: function() {
            console.log('返回成功，开始通知昆虫详情页更新数据');
            // 模拟延迟，确保页面已返回
            setTimeout(() => {
              // 通知昆虫详情页更新数据
              if (typeof prevPage.updateObservationNotes === 'function') {
                console.log('调用updateObservationNotes方法更新数据，isNewDiscovery值为:', discoveryData.isNewDiscovery);
                prevPage.updateObservationNotes(discoveryData);
              } else {
                console.log('没有updateObservationNotes方法，调用loadInsectDetail方法重新加载数据');
                // 如果没有updateObservationNotes方法，则重新加载数据
                prevPage.loadInsectDetail();
              }
            }, 300);
          },
          fail: function(err) {
            console.error('返回上一页失败:', err);
          }});
        } else {
          // 如果没有上一页（直接返回到首页），设置需要刷新标志
          app.globalData.needRefreshHomePage = true;
          wx.navigateBack();
        }
        
        this.setData({
          isLoading: false
        });
        
        console.log('===== 保存发现记录完成 =====');
      }, 1500);
    }, 2000);
  },

  // 取消编辑
  cancelEdit: function() {
    wx.navigateBack();
  }
});