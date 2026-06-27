// miniprogram/pages/admin/insects/insects.js
Page({
  data: {
    insects: [],
    loading: true,
    pageSize: 10,
    pageNum: 1,
    hasMore: true,
    isLoadingInsects: false,
    searchKey: '',
    filterOptions: [
      { name: '全部昆虫', value: 'all' },
      { name: '未配置图片', value: 'noImage' },
      { name: '已配置图片', value: 'hasImage' }
    ],
    currentFilter: 'all',
    sortOptions: [
      { name: '添加时间', value: 'createTime' },
      { name: '识别次数', value: 'recognizeCount' },
      { name: '名称', value: 'name' }
    ],
    currentSort: 'createTime',
    sortOrder: 'desc',
    syncing: false
  },

  onLoad: function() {
    console.log('insects页面加载');
    this.loadInsects();
  },

  onShow: function() {
    console.log('insects页面显示');
  },
  
  // 同步昆虫数据
  syncInsectData: async function() {
    if (this.data.syncing) return;
    
    wx.showModal({
      title: '数据同步',
      content: '确定要同步昆虫数据吗？这将会从用户发现记录中提取昆虫信息并更新到昆虫集合中。',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ syncing: true });
          wx.showLoading({ title: '同步中...' });
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'syncInsectData'
            });
            
            wx.hideLoading();
            this.setData({ syncing: false });
            
            if (result.result.success) {
              wx.showModal({
                title: '同步成功',
                content: `\n• 新增昆虫: ${result.result.addedCount}\n• 更新昆虫: ${result.result.updatedCount}\n• 总昆虫数: ${result.result.totalCount}`,
                showCancel: false,
                success: () => {
                  this.loadInsects(); // 同步完成后刷新列表
                }
              });
            } else {
              wx.showToast({
                title: '同步失败: ' + result.result.message,
                icon: 'none',
                duration: 3000
              });
            }
          } catch (error) {
            console.error('同步昆虫数据失败:', error);
            wx.hideLoading();
            this.setData({ syncing: false });
            wx.showToast({
              title: '云函数调用失败',
              icon: 'none',
              duration: 3000
            });
          }
        }
      }
    });
  },

  // 加载昆虫列表
  loadInsects: async function(loadMore = false) {
    // 添加防重复调用机制
    if (this.data.isLoadingInsects) {
      console.log('加载函数已经在执行中，防止重复调用');
      return;
    }
    
    console.log('加载昆虫列表函数被调用 - 加载更多:', loadMore, '当前页码:', this.data.pageNum);
    
    // 显示加载提示
    wx.showLoading({ title: loadMore ? '加载更多...' : '加载中...' });
    
    this.setData({ isLoadingInsects: true });
    
    if (!loadMore) {
      this.setData({ loading: true, pageNum: 1 });
    }

    try {
      // 检查云开发环境是否初始化
      if (!wx.cloud) {
        throw new Error('云开发环境未初始化，请检查基础库版本');
      }
      
      console.log('准备调用云函数 getInsectList，参数:', {
        pageNum: loadMore ? this.data.pageNum + 1 : 1,
        pageSize: this.data.pageSize,
        searchKey: this.data.searchKey,
        filter: this.data.currentFilter,
        sortBy: this.data.currentSort,
        sortOrder: this.data.sortOrder
      });
      
      // 记录调用开始时间
      const startTime = Date.now();
      
      // 修复-405015错误：移除不必要的env参数，使用默认环境
      const callResult = await wx.cloud.callFunction({
        name: 'getInsectList',
        data: {
          pageNum: loadMore ? this.data.pageNum + 1 : 1,
          pageSize: this.data.pageSize,
          searchKey: this.data.searchKey,
          filter: this.data.currentFilter,
          sortBy: this.data.currentSort,
          sortOrder: this.data.sortOrder,
          timestamp: Date.now()
        }
      });
      
      // 记录调用耗时
      const duration = Date.now() - startTime;
      console.log('云函数调用完成，耗时:', duration, 'ms');
      
      // 全面的结果检查
      if (!callResult || !callResult.result) {
        throw new Error('云函数调用失败或未返回有效数据');
      }
      
      const { result } = callResult;

      // 处理云函数内部返回的错误
      if (result.success === false) {
        throw new Error(result.error || '云函数执行失败');
      }

      // 直接使用云函数返回的数据，包含了hasMore信息
      const insects = result.insects || [];
      console.log('获取到昆虫数据数量:', insects.length);
      
      // 确保图片URL稳定
      const processedInsects = insects.map(insect => ({
        ...insect,
        imageUrl: insect.imageUrl || ''
      }));

      // 统一状态管理
    if (result.insects && result.insects.length > 0) {
      if (loadMore) {
        this.setData({
          insects: [...this.data.insects, ...processedInsects],
          pageNum: this.data.pageNum + 1,
          hasMore: result.hasMore || processedInsects.length >= this.data.pageSize
        });
      } else {
        this.setData({
          insects: processedInsects,
          pageNum: 1,
          hasMore: result.hasMore || processedInsects.length >= this.data.pageSize
        });
      }
    } else {
      // 没有新数据，设置hasMore为false
      this.setData({
        hasMore: false
      });
    }
    
    // 最后统一重置加载状态
    this.setData({
      isLoadingInsects: false,
      loading: false
    });
      
      console.log('昆虫列表加载成功，总数量:', this.data.insects.length, '是否有更多:', this.data.hasMore);
      
    } catch (error) {
      console.error('加载昆虫列表失败:', error.message || error);
      
      let errorMessage = '加载失败，请重试';
      if (error.errMsg) {
        errorMessage = error.errMsg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 简化错误处理，统一使用toast提示
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    }
    
    // 确保状态被正确重置
    this.setData({ 
      loading: false,
      isLoadingInsects: false
    });
    wx.hideLoading();
  },

  // 搜索昆虫
  onSearch: function(e) {
    this.setData({ searchKey: e.detail.value });
    this.loadInsects();
  },

  // 过滤昆虫
  onFilterChange: function(e) {
    this.setData({ currentFilter: e.detail.value });
    this.loadInsects();
  },

  // 排序昆虫
  onSortChange: function(e) {
    const sortBy = e.detail.value;
    let sortOrder = 'desc';
    
    // 如果点击的是当前排序字段，则切换排序顺序
    if (sortBy === this.data.currentSort) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }
    
    this.setData({ currentSort: sortBy, sortOrder: sortOrder });
    this.loadInsects();
  },

  // 查看昆虫详情
  editInsect: function(e) {
    console.log('点击昆虫项，开始处理导航:', e);
    const insect = e.currentTarget.dataset.insect;
    console.log('昆虫数据:', insect);
    
    if (!insect) {
      console.error('昆虫数据不存在');
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      return;
    }
    
    // 优先使用externalId，如果没有则使用id（兼容旧数据）
    const navigationId = insect.externalId || insect.id;
    console.log('使用的导航ID:', navigationId);
    
    // 使用带./的相对路径确保正确解析
    wx.navigateTo({
      url: './detail-insect',
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          id: navigationId
        });
        console.log('成功发送数据到详情页');
      },
      fail: function(err) {
        console.error('导航到详情页失败:', err);
        wx.showToast({
          title: '跳转失败: ' + (err.errMsg || '未知错误'),
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 图片压缩处理函数
  compressImage: function(filePath) {
    return new Promise((resolve, reject) => {
      console.log('开始压缩图片:', filePath);
      
      // 先获取图片信息，了解原始尺寸
      wx.getImageInfo({
        src: filePath,
        success: (imageInfo) => {
          console.log('原图信息:', imageInfo.width, 'x', imageInfo.height);
          
          // 计算压缩后的尺寸
          let targetWidth = imageInfo.width;
          let targetHeight = imageInfo.height;
          const maxDimension = 800; // 管理员上传图片的最大尺寸（比用户上传小一些）
          const quality = 0.8; // 压缩质量
          
          // 如果图片尺寸超过最大尺寸，按比例缩小
          if (targetWidth > maxDimension || targetHeight > maxDimension) {
            const aspectRatio = targetWidth / targetHeight;
            if (aspectRatio > 1) {
              // 宽度大于高度
              targetWidth = maxDimension;
              targetHeight = maxDimension / aspectRatio;
            } else {
              // 高度大于宽度
              targetHeight = maxDimension;
              targetWidth = maxDimension * aspectRatio;
            }
          }
          
          console.log('压缩目标尺寸:', targetWidth, 'x', targetHeight, 'quality:', quality);
          
          // 使用canvas进行图片压缩
          const ctx = wx.createCanvasContext('adminCompressCanvas');
          ctx.drawImage(filePath, 0, 0, targetWidth, targetHeight);
          ctx.draw(false, () => {
            // 从canvas导出压缩后的图片
            wx.canvasToTempFilePath({
              canvasId: 'adminCompressCanvas',
              x: 0,
              y: 0,
              width: targetWidth,
              height: targetHeight,
              destWidth: targetWidth,
              destHeight: targetHeight,
              quality: quality,
              success: (res) => {
                console.log('图片压缩成功:', res.tempFilePath);
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                console.error('Canvas压缩失败:', err);
                // 如果canvas压缩失败，尝试使用微信自带的压缩API
                wx.compressImage({
                  src: filePath,
                  quality: Math.floor(quality * 100),
                  success: (compressRes) => {
                    console.log('使用微信压缩API成功:', compressRes.tempFilePath);
                    resolve(compressRes.tempFilePath);
                  },
                  fail: (compressErr) => {
                    console.error('图片压缩失败，使用原图:', compressErr);
                    // 压缩失败时使用原图
                    resolve(filePath);
                  }
                });
              }
            });
          });
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err);
          reject(err);
        }
      });
    });
  },

  // 配置昆虫图片
  configImage: function(e) {
    const insect = e.currentTarget.dataset.insect;
    if (!insect) {
      console.error('昆虫数据不存在');
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      return;
    }
    
    // 优先使用externalId，如果没有则使用id
    const navigationId = insect.externalId || insect.id;
    
    // 使用带./的相对路径确保正确解析
    wx.navigateTo({
      url: './detail-insect',
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          id: navigationId,
          mode: 'image_config'
        });
        console.log('成功发送数据到详情页(图片配置模式)');
      },
      fail: function(err) {
        console.error('导航到详情页失败:', err);
        wx.showToast({
          title: '跳转失败: ' + (err.errMsg || '未知错误'),
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 预览昆虫图片
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        urls: [url]
      });
    }
  },

  // 上拉加载更多
  onReachBottom: function() {
    console.log('触底加载触发，当前状态: 加载中=' + this.data.loading + ', 有更多=' + this.data.hasMore);
    if (!this.data.loading && this.data.hasMore && !this.data.isLoadingInsects) {
      console.log('开始加载更多数据，当前页码:', this.data.pageNum);
      this.loadInsects(true);
    } else {
      console.log('不满足加载条件，停止加载');
    }
  },

  // 刷新页面
  onPullDownRefresh: function() {
    console.log('下拉刷新触发');
    // 无论如何都重置并重新加载
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    
    this.loadInsects(false, () => {
      wx.stopPullDownRefresh();
    });
  },

  // 页面卸载时清理标志
  onUnload: function() {
    console.log('insects页面卸载');
    this.setData({ isLoadingInsects: false });
  },
  
  // 图片加载成功处理函数 - 避免频繁打印日志
  onImageLoad: function(e) {
    // 只在必要时打印日志，避免console疯狂加载
    if (e.target.dataset.log) {
      console.log('图片加载成功:', e.target.dataset.log);
    }
  },
  
  // 图片加载错误处理函数
  onImageError: function(e) {
    // 错误发生时保持静默，使用默认图片
    console.warn('图片加载失败，使用默认图片');
  }
});