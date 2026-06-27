// miniprogram/pages/admin/badges/badges.js
Page({
  data: {
    badges: [],
    loading: true,
    editingBadge: null,
    showEditModal: false
  },

  onLoad: function() {
    this.loadBadges();
  },

  // 加载勋章列表
  loadBadges: async function() {
    console.log('加载勋章列表函数被调用');
    this.setData({ loading: true });

    try {
      // 检查云开发环境是否初始化
      if (!wx.cloud) {
        throw new Error('云开发环境未初始化，请检查基础库版本');
      }
      
      console.log('准备调用云函数 getBadgeList');
      console.log('调用参数:', {});
      
      // 记录调用开始时间
      const startTime = Date.now();
      
      const callResult = await wx.cloud.callFunction({
        name: 'getBadgeList',
        data: {
          // 添加时间戳避免缓存问题
          timestamp: Date.now(),
          // 添加环境信息
          env: 'cloud1-8ggzed032ed5e7ec'
        }
      });
      
      // 记录调用耗时
      const duration = Date.now() - startTime;
      console.log('云函数调用完成，耗时:', duration, 'ms');
      console.log('云函数调用返回结果:', callResult);
      
      // 全面的结果检查
      if (!callResult) {
        throw new Error('云函数调用失败，未返回任何结果');
      }
      
      if (!callResult.result) {
        throw new Error('云函数调用成功但未返回有效数据');
      }

      const { result } = callResult;
      console.log('云函数返回的result:', result);

      // 处理云函数内部返回的错误
      if (!result.success) {
        throw new Error(result.message || '加载失败');
      }

      this.setData({
        badges: result.badges,
        loading: false
      });
      console.log('勋章列表加载成功，共加载', result.badges.length, '条数据');
    } catch (error) {
      console.error('加载勋章列表失败 - 详细错误信息:', error);
      console.error('错误类型:', typeof error);
      console.error('错误堆栈:', error.stack);
      
      let errorMessage = '加载失败，请重试';
      let showDetail = false;
      
      // 专门处理FunctionName参数未找到的错误
      if (error.errMsg && error.errMsg.includes('FunctionName parameter could not be found')) {
        errorMessage = '云函数未找到';
        showDetail = true;
      } else if (error.errMsg) {
        errorMessage = error.errMsg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 根据错误类型显示不同的提示信息
      if (showDetail) {
        wx.showModal({
          title: '云函数错误',
          content: '请确保云函数 getBadgeList 已正确部署到环境 cloud1-8ggzed032ed5e7ec\n\n错误详情: ' + errorMessage,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        });
      }
      
      this.setData({ loading: false });
    }
  },

  // 打开编辑勋章弹窗
  openEditModal: function(e) {
    const badgeId = e.currentTarget.dataset.id;
    const badge = this.data.badges.find(item => item.id === badgeId) || {
      id: null,
      name: '',
      requiredCount: 0,
      icon: '',
      description: ''
    };

    this.setData({
      editingBadge: badge,
      showEditModal: true
    });
  },

  // 关闭编辑弹窗
  closeEditModal: function() {
    this.setData({ showEditModal: false });
  },

  // 输入框内容变化
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    // 数据验证
    if (field === 'requiredCount') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        wx.showToast({
          title: '请输入有效的数字',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({
      [`editingBadge.${field}`]: value
    });
  },

  // 上传勋章图标
  uploadIcon: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        wx.showLoading({
          title: '上传中...',
        });
        
        try {
          // 上传图片到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `badge_icons/${Date.now()}.png`,
            filePath: tempFilePath
          });
          
          this.setData({
            'editingBadge.icon': uploadResult.fileID
          });
          
          wx.hideLoading();
        } catch (error) {
          console.error('上传图标失败:', error);
          wx.hideLoading();
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  },

  // 保存勋章配置
  saveBadge: async function() {
    const { editingBadge } = this.data;
    
    // 数据验证
    const validation = this.validateBadgeData(editingBadge);
    if (!validation.isValid) {
      wx.showToast({
        title: validation.message,
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
    });
    
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'saveBadge',
        data: {
          badge: {
            id: editingBadge.id,
            name: editingBadge.name,
            requiredCount: parseInt(editingBadge.requiredCount),
            icon: editingBadge.icon || '',
            description: editingBadge.description || ''
          }
        }
      });
      
      wx.hideLoading();
      
      if (result.success) {
        wx.showToast({
          title: editingBadge.id ? '更新成功' : '添加成功'
        });
        this.closeEditModal();
        this.loadBadges();
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存勋章失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  // 删除勋章
  deleteBadge: function(e) {
    const badgeId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该勋章吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const { result } = await wx.cloud.callFunction({
              name: 'deleteBadge',
              data: { badgeId }
            });
            
            if (result.success) {
              wx.showToast({
                title: '删除成功'
              });
              this.loadBadges();
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('删除勋章失败:', error);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 添加新勋章
  addBadge: function() {
    this.setData({
      editingBadge: {
        id: null,
        name: '',
        level: '',
        requiredCount: 0,
        icon: '',
        description: ''
      },
      showEditModal: true
    });
  },

  // 数据验证函数
  validateBadgeData: function(badge) {
    if (!badge.name || badge.name.trim() === '') {
      return { isValid: false, message: '请输入勋章名称' };
    }
    
    if (badge.name.length > 20) {
      return { isValid: false, message: '勋章名称不能超过20个字符' };
    }
    
    if (!badge.requiredCount || badge.requiredCount <= 0) {
      return { isValid: false, message: '请输入有效的所需昆虫数量' };
    }
    
    if (badge.requiredCount > 10000) {
      return { isValid: false, message: '所需昆虫数量不能超过10000' };
    }
    
    if (badge.description && badge.description.length > 200) {
      return { isValid: false, message: '描述不能超过200个字符' };
    }
    
    return { isValid: true, message: '' };
  },

  // 批量删除勋章
  batchDeleteBadges: function() {
    wx.showModal({
      title: '批量删除',
      content: '此功能正在开发中',
      showCancel: false
    });
  },
  
  // 导出勋章数据
  exportBadges: function() {
    wx.showModal({
      title: '数据导出',
      content: '此功能正在开发中',
      showCancel: false
    });
  }
});