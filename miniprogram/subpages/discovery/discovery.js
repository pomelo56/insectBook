// 昆虫发现地图页面
const app = getApp();

Page({
  data: {
    // 地图相关
    longitude: 116.397428, // 默认北京经度
    latitude: 39.90923,   // 默认北京纬度
    markers: [],          // 地图标记点
    mapContext: null,
    showDetail: false,    // 是否显示详情弹窗
    selectedInsect: {},   // 当前选中的昆虫信息
    showFilter: false,    // 是否显示筛选选项
    timeFilter: 'today',   // 时间筛选：today, month, all
    detailAnimation: {},  // 弹窗动画
    
    // 统计数据
    discoveryCount: 11,
    searchRadius: 3.2,
    activityLevel: 78,
    explorationTip: '雨后是观察昆虫的最佳时机，许多昆虫会在这个时候出来活动。',
    
    // 模拟数据 - 实际应用中应该从云数据库获取
    insectDiscoveries: [
      {
        id: '1',
        name: '蓝闪蝶',
        image: 'https://t7.baidu.com/it/u=1935592311,2578343870&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=313',
        longitude: 116.40,
        latitude: 39.91,
        date: '2023年10月15日',
        location: '城市公园',
        weather: '晴朗',
        season: '秋季',
        time: '下午3点',
        notes: '这只蝴蝶的翅膀在阳光下会发出蓝色的闪光，非常漂亮！它停在一朵紫色的花上吸食花蜜，停留了大约5分钟。',
        rare: true
      },
      {
        id: '2',
        name: '七星瓢虫',
        image: 'https://t7.baidu.com/it/u=1464345686,3372357833&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.41,
        latitude: 39.90,
        date: '2023年10月10日',
        location: '小区花园',
        weather: '多云',
        season: '秋季',
        time: '上午10点',
        notes: '在一片绿叶上发现了这只七星瓢虫，正在捕食蚜虫。',
        rare: false
      },
      {
        id: '3',
        name: '大刀螳螂',
        image: 'https://t7.baidu.com/it/u=3061347029,3963666737&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=375',
        longitude: 116.39,
        latitude: 39.92,
        date: '2023年10月8日',
        location: '郊外草地',
        weather: '晴天',
        season: '秋季',
        time: '下午2点',
        notes: '这只螳螂很大，大约有7厘米长，静静地趴在草叶上等待猎物。',
        rare: false
      },
      {
        id: '4',
        name: '红蜻蜓',
        image: 'https://t7.baidu.com/it/u=1029684111,3681641525&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.42,
        latitude: 39.89,
        date: '2023年9月30日',
        location: '河边湿地',
        weather: '阵雨过后',
        season: '秋季',
        time: '上午9点',
        notes: '雨后在河边发现了一群红蜻蜓在低空飞行，非常美丽。',
        rare: false
      },
      {
        id: '5',
        name: '金凤蝶',
        image: 'https://t7.baidu.com/it/u=3202753782,1290819446&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.415,
        latitude: 39.905,
        date: '2023年10月12日',
        location: '植物园',
        weather: '晴转多云',
        season: '秋季',
        time: '下午1点',
        notes: '这只金凤蝶的翅膀呈金黄色，在阳光下闪闪发光，非常引人注目。',
        rare: false
      },
      {
        id: '6',
        name: '竹节虫',
        image: 'https://t7.baidu.com/it/u=2586799188,3993856518&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.395,
        latitude: 39.915,
        date: '2023年10月5日',
        location: '森林公园',
        weather: '阴天',
        season: '秋季',
        time: '上午11点',
        notes: '竹节虫的伪装能力非常强，如果不仔细看，几乎发现不了它。它的身体形状和颜色都与树枝非常相似。',
        rare: false
      },
      {
        id: '7',
        name: '独角仙',
        image: 'https://t7.baidu.com/it/u=3826307275,1362171549&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.405,
        latitude: 39.918,
        date: '2023年9月28日',
        location: '后山树林',
        weather: '晴朗',
        season: '秋季',
        time: '下午4点',
        notes: '这只独角仙的体型很大，头部有一个明显的角，看起来很威武。它正在腐木上觅食。',
        rare: true
      },
      {
        id: '8',
        name: '玉带凤蝶',
        image: 'https://t7.baidu.com/it/u=110965829,3166565942&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.425,
        latitude: 39.902,
        date: '2023年10月14日',
        location: '滨江公园',
        weather: '微风',
        season: '秋季',
        time: '上午9点半',
        notes: '玉带凤蝶的翅膀上有一条白色的带状花纹，非常漂亮。它在花丛中飞来飞去，吸食花蜜。',
        rare: false
      },
      {
        id: '9',
        name: '纺织娘',
        image: 'https://t7.baidu.com/it/u=3719569641,3380330748&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.388,
        latitude: 39.912,
        date: '2023年10月3日',
        location: '郊外农田',
        weather: '晴朗',
        season: '秋季',
        time: '傍晚5点',
        notes: '晚上在田间听到纺织娘的鸣叫声，找到了这只绿色的纺织娘，它的身体细长，看起来很优雅。',
        rare: false
      },
      {
        id: '10',
        name: '金龟子',
        image: 'https://t7.baidu.com/it/u=2958935765,1476211847&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=333',
        longitude: 116.412,
        latitude: 39.895,
        date: '2023年9月25日',
        location: '小区花丛',
        weather: '多云',
        season: '秋季',
        time: '下午2点半',
        notes: '这只金龟子的身体呈金黄色，在阳光下非常耀眼。它正在花朵上采集花粉。',
        rare: false
      }
    ]
  },

  onLoad: function() {
    // 初始化地图上下文
    this.mapContext = wx.createMapContext('myMap');
    
    // 创建动画实例
    this.animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
    
    // 获取用户位置
    this.getUserLocation();
    
    // 初始化地图标记点
    this.initMarkers();
    
    // 加载探索小贴士
    this.loadExplorationTip();
  },

  // 加载探索小贴士
  loadExplorationTip: function() {
    const tips = [
      '雨后是观察昆虫的最佳时机，许多昆虫会在这个时候出来活动。',
      '早晨和傍晚是大多数昆虫最活跃的时间。',
      '花朵附近往往聚集着各种蝴蝶和蜜蜂。',
      '落叶堆和腐木下隐藏着许多有趣的昆虫。',
      '水边环境是蜻蜓和豆娘的栖息地。'
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.setData({
      explorationTip: randomTip
    });
  },

  // 获取用户位置（已移除重复方法）
  
  // 已移除重复的getUserLocation方法，保留下面更完善的版本

  // 初始化地图标记点
  initMarkers: function() {
    // 定义不同颜色的标记点图标路径
    const markerIcons = [
      '/images/icons/bug-marker-rare.png', // 稀有 - 紫色
      '/images/icons/bug-marker.png',      // 默认 - 绿色
      '/images/icons/bug1.svg',            // 蓝色
      '/images/icons/bug2.svg',            // 红色
      '/images/icons/bug3.svg',            // 黄色
      '/images/icons/bug4.svg'             // 橙色
    ];
    
    const markers = this.data.insectDiscoveries.map((insect, index) => {
      // 为每个标记点选择不同的图标
      const iconIndex = insect.rare ? 0 : (index % (markerIcons.length - 1)) + 1;
      
      return {
        id: insect.id,
        latitude: insect.latitude,
        longitude: insect.longitude,
        width: 40,
        height: 40,
        iconPath: markerIcons[iconIndex],
        callout: {
          content: insect.name,
          display: 'BYCLICK',
          color: '#333',
          fontSize: 12,
          borderRadius: 4,
          padding: 6,
          bgColor: '#fff'
        }
      };
    });
    
    this.setData({ markers });
  },

  // 点击标记点显示昆虫详情
  showInsectDetail: function(e) {
    const markerId = e.markerId;
    const selectedInsect = this.data.insectDiscoveries.find(item => item.id === markerId);
    
    if (selectedInsect) {
      // 动画效果
      this.animation.opacity(1).step();
      
      this.setData({
        selectedInsect,
        showDetail: true,
        detailAnimation: this.animation.export()
      });
    }
  },

  // 隐藏昆虫详情弹窗
  hideInsectDetail: function() {
    // 动画效果
    this.animation.opacity(0).step();
    this.setData({
      detailAnimation: this.animation.export()
    });
    
    setTimeout(() => {
      this.setData({ showDetail: false });
    }, 300);
  },
  
  // 阻止事件冒泡
  stopPropagation: function(e) {
    e.stopPropagation();
  },

  // 切换筛选显示
  toggleFilter: function() {
    this.setData({ showFilter: !this.data.showFilter });
  },

  // 设置时间筛选
  setTimeFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ 
      timeFilter: filter,
      showFilter: false 
    });
    
    // 根据筛选条件过滤数据
    this.filterDiscoveriesByTime(filter);
  },

  // 根据时间筛选发现记录
  filterDiscoveriesByTime: function(filter) {
    let filteredDiscoveries = [...this.data.insectDiscoveries];
    
    // 模拟时间筛选逻辑
    if (filter === 'today') {
      // 实际应用中应该根据日期进行过滤
      wx.showToast({
        title: '已筛选今天的数据',
        icon: 'none'
      });
    } else if (filter === 'month') {
      wx.showToast({
        title: '已筛选本月的数据',
        icon: 'none'
      });
    } else {
      wx.showToast({
        title: '已显示全部数据',
        icon: 'none'
      });
    }
    
    // 更新地图标记
    this.initMarkers();
  },

  // 地图缩放功能已移除（用户反馈无效）

  // 定位到用户当前位置
  locateUser: function() {
    this.getUserLocation();
  },

  // 获取用户位置并处理
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
              // 授权失败，打开设置页面
              wx.showModal({
                title: '位置权限',
                content: '获取您的位置可以更好地展示附近的昆虫发现，是否前往设置开启位置权限？',
                success: function(modalRes) {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  } else {
                    wx.showToast({
                      title: '使用默认位置',
                      icon: 'none'
                    });
                  }
                }
              });
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
        
        // 移动地图到用户位置
        that.mapContext.includePoints({
          points: [
            { longitude: res.longitude, latitude: res.latitude }
          ]
        });
        
        // 计算探索半径内的发现
        that.calculateDiscoveriesInRadius(res.longitude, res.latitude);
      },
      fail: function(err) {
        console.error('获取位置失败:', err);
        if (retryCount < maxRetries) {
          // 重试获取位置
          setTimeout(function() {
            that.getLocationWithRetry(retryCount + 1);
          }, 1000);
        } else {
          wx.showToast({
            title: '获取位置失败，使用默认位置',
            icon: 'none'
          });
        }
      }
    });
  },

  // 计算探索半径内的发现
  calculateDiscoveriesInRadius: function(userLongitude, userLatitude) {
    const radius = this.data.searchRadius;
    let count = 0;
    
    // 模拟计算，实际应用中应该使用Haversine公式计算两点间距离
    this.data.insectDiscoveries.forEach(insect => {
      count++;
    });
    
    this.setData({
      discoveryCount: count
    });
  },

  // 添加新的昆虫发现
  addDiscovery: function() {
    // 弹出选择菜单：拍照或从相册选择
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        if (!res.cancel) {
          if (res.tapIndex === 0) {
            // 拍照
            this.takePhoto();
          } else if (res.tapIndex === 1) {
            // 从相册选择
            this.chooseFromAlbum();
          }
        }
      }
    });
  },

  // 拍照获取昆虫图片
  takePhoto: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.processImage(tempFilePath);
      },
      fail: () => {
        wx.showToast({
          title: '拍照失败',
          icon: 'error'
        });
      }
    });
  },

  // 从相册选择昆虫图片
  chooseFromAlbum: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.processImage(tempFilePath);
      },
      fail: () => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        });
      }
    });
  },

  // 处理图片并获取位置信息
  processImage: function(imagePath) {
    wx.showLoading({
      title: '处理图片中...',
    });
    
    // 模拟从图片中提取位置信息（实际应用中需要调用专门的API）
    setTimeout(() => {
      wx.hideLoading();
      
      // 跳转到昆虫信息编辑页面，并传递图片路径和位置信息
      wx.navigateTo({
        url: `/subpages/edit-discovery/edit-discovery?imagePath=${encodeURIComponent(imagePath)}&longitude=${this.data.longitude}&latitude=${this.data.latitude}`
      });
    }, 1500);
  },

  // 分享发现
  shareDiscovery: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 更多选项
  moreOptions: function() {
    wx.showActionSheet({
      itemList: ['编辑发现', '删除发现', '查看大图', '收藏'],
      success: (res) => {
        if (!res.cancel) {
          switch(res.tapIndex) {
            case 0:
              // 编辑发现
              this.editDiscovery();
              break;
            case 1:
              // 删除发现
              this.deleteDiscovery();
              break;
            case 2:
              // 查看大图
              this.viewImage();
              break;
            case 3:
              // 收藏
              this.favoriteDiscovery();
              break;
          }
        }
      }
    });
  },

  // 编辑发现
  editDiscovery: function() {
    const insect = this.data.selectedInsect;
    wx.navigateTo({
      url: `/pages/edit-discovery/edit-discovery?insectId=${insect.id}`
    });
  },

  // 删除发现
  deleteDiscovery: function() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个发现记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 实际应用中应该从数据库删除记录
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.hideInsectDetail();
        }
      }
    });
  },

  // 查看大图
  viewImage: function() {
    const imageUrl = this.data.selectedInsect.image;
    wx.previewImage({
      urls: [imageUrl]
    });
  },

  // 收藏发现
  favoriteDiscovery: function() {
    wx.showToast({
      title: '已添加到收藏',
      icon: 'success'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadUserData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 加载用户数据
  loadUserData: function() {
    // 实际应用中应该从云数据库获取数据
    // 这里只是模拟刷新
    this.initMarkers();
    this.loadExplorationTip();
    
    wx.showToast({
      title: '数据已更新',
      icon: 'success'
    });
  }
});