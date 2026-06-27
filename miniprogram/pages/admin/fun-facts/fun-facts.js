// miniprogram/pages/admin/fun-facts/fun-facts.js
Page({
  data: {
    funFacts: [],
    loading: true,
    editingFact: null,
    showEditModal: false,
    pageSize: 20,
    pageNum: 1,
    hasMore: true,
    searchKey: ''
  },

  onLoad: function() {
    this.loadFunFacts();
  },

  // 加载冷知识列表
  loadFunFacts: async function(loadMore = false) {
    // 检查云开发环境是否正确初始化
    if (!wx.cloud || !wx.cloud.callFunction) {
      console.error('云开发未正确初始化或不可用');
      wx.showModal({
        title: '环境异常',
        content: '云开发功能不可用，请检查小程序配置和运行环境',
        showCancel: false
      });
      this.setData({ loading: false });
      return;
    }

    if (!loadMore) {
      this.setData({ loading: true, pageNum: 1 });
    }

    try {
      console.log('===== 准备调用云函数 getFunFactsList =====');
      const params = {
        pageNum: loadMore ? this.data.pageNum + 1 : 1,
        pageSize: this.data.pageSize,
        searchKey: this.data.searchKey,
        timestamp: Date.now(),
        // 添加环境信息
        env: 'cloud1-8ggzed032ed5e7ec'
      };
      console.log('调用参数:', params);
      
      // 记录调用开始时间
      const startTime = Date.now();
      
      const callResult = await wx.cloud.callFunction({
        name: 'getFunFactsList',
        data: params
      });
      
      // 记录调用耗时
      const duration = Date.now() - startTime;
      console.log('云函数调用完成，耗时:', duration, 'ms');
      console.log('云函数调用返回结果:', callResult);
      
      // 检查调用结果是否存在
      if (!callResult) {
        throw new Error('云函数调用无返回结果');
      }
      
      // 检查是否有错误信息
      if (callResult.errMsg && callResult.errMsg.includes('fail')) {
        throw new Error(`云函数调用失败: ${callResult.errMsg}`);
      }
      
      const { result } = callResult;
      
      // 检查result是否存在
      if (result === undefined || result === null) {
        throw new Error('云函数返回的result为空');
      }
      
      console.log('云函数返回的result:', result);

      if (result.success) {
        const funFacts = result.funFacts || [];
        const hasMore = funFacts.length === this.data.pageSize;

        this.setData({
          funFacts: loadMore ? [...this.data.funFacts, ...funFacts] : funFacts,
          loading: false,
          hasMore: hasMore,
          pageNum: loadMore ? this.data.pageNum + 1 : 1
        });
      } else {
        console.error('云函数执行失败:', result.error || '未知错误');
        throw new Error(result.error || '加载失败');
      }
    } catch (error) {
      console.error('===== 加载冷知识列表失败 - 详细错误信息 =====');
      console.error('错误对象:', error);
      console.error('错误类型:', typeof error);
      console.error('错误堆栈:', error.stack);
      
      let errorMessage = '加载失败，请重试';
      let showDetail = false;
      
      // 专门处理FunctionName找不到的错误
      if (error.message && error.message.includes('FunctionName parameter could not be found')) {
        errorMessage = '云函数未找到';
        showDetail = true;
      } else if (error.errCode === -501000) {
        errorMessage = '云函数调用失败(errCode:-501000)\n请确保云函数已正确部署并使用正确的环境';
      } else if (error.errMsg) {
        errorMessage = error.errMsg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      wx.hideLoading();
      
      // 根据错误类型显示不同的提示信息
      if (showDetail) {
        wx.showModal({
          title: '云函数错误',
          content: '请确保云函数 getFunFactsList 已正确部署到环境 cloud1-8ggzed032ed5e7ec\n\n错误详情: ' + errorMessage,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showModal({
          title: '加载失败',
          content: errorMessage,
          showCancel: false
        });
      }
      
      this.setData({ loading: false });
    } finally {
      console.log('===== loadFunFacts函数执行完毕 =====');
    }
  },

  // 搜索冷知识
  onSearch: function(e) {
    this.setData({ searchKey: e.detail.value });
    this.loadFunFacts();
  },

  // 打开编辑冷知识弹窗
  openEditModal: function(e) {
    const factId = e.currentTarget.dataset.id;
    const fact = this.data.funFacts.find(item => item.id === factId) || {
      id: null,
      content: '',
      insectName: '',
      displayOrder: 0
    };

    this.setData({
      editingFact: fact,
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
    if (field === 'displayOrder') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        wx.showToast({
          title: '请输入有效的排序数字',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({
      [`editingFact.${field}`]: value
    });
  },

  // 保存冷知识
  saveFunFact: async function() {
    const { editingFact } = this.data;
    
    // 数据验证
    const validation = this.validateFunFactData(editingFact);
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
      const callResult = await wx.cloud.callFunction({
        name: 'saveFunFactSimple',  // 使用简化版本进行测试
        data: {
          fact: {
            id: editingFact.id,
            content: editingFact.content.trim(),
            insectName: editingFact.insectName.trim() || '',
            displayOrder: parseInt(editingFact.displayOrder) || 0
          }
        }
      });
      
      wx.hideLoading();
      
      // 检查调用结果
      if (!callResult) {
        throw new Error('云函数调用无返回结果');
      }
      
      // 检查是否有错误信息
      if (callResult.errMsg && callResult.errMsg.includes('fail')) {
        throw new Error(`云函数调用失败: ${callResult.errMsg}`);
      }
      
      const { result } = callResult;
      
      // 检查result是否存在
      if (result === undefined || result === null) {
        throw new Error('云函数返回的result为空');
      }
      
      console.log('保存冷知识 - 云函数返回结果:', result);
      
      if (result.success) {
        wx.showToast({
          title: editingFact.id ? '更新成功' : '添加成功'
        });
        this.closeEditModal();
        this.loadFunFacts();
      } else {
        const errorMessage = result.error || '保存失败';
        console.error('保存冷知识失败:', errorMessage);
        wx.showToast({
          title: errorMessage,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存冷知识失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  // 删除冷知识
  deleteFunFact: function(e) {
    const factId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该冷知识吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const callResult = await wx.cloud.callFunction({
              name: 'deleteFunFactSimple',  // 使用简化版本进行测试
              data: { factId }
            });
            
            // 检查调用结果
            if (!callResult) {
              throw new Error('云函数调用无返回结果');
            }
            
            // 检查是否有错误信息
            if (callResult.errMsg && callResult.errMsg.includes('fail')) {
              throw new Error(`云函数调用失败: ${callResult.errMsg}`);
            }
            
            const { result } = callResult;
            
            // 检查result是否存在
            if (result === undefined || result === null) {
              throw new Error('云函数返回的result为空');
            }
            
            console.log('删除冷知识 - 云函数返回结果:', result);
            
            if (result.success) {
              wx.showToast({
                title: '删除成功'
              });
              this.loadFunFacts();
            } else {
              const errorMessage = result.error || '删除失败';
              console.error('删除冷知识失败:', errorMessage);
              wx.showToast({
                title: errorMessage,
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('删除冷知识失败:', error);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 添加新冷知识
  addFunFact: function() {
    this.setData({
      editingFact: {
        id: null,
        content: '',
        insectName: '',
        displayOrder: 0
      },
      showEditModal: true
    });
  },

  // 上拉加载更多
  onReachBottom: function() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadFunFacts(true);
    }
  },

  // 刷新页面
  onPullDownRefresh: function() {
    this.loadFunFacts();
    wx.stopPullDownRefresh();
  },

  // 数据验证函数
  validateFunFactData: function(fact) {
    if (!fact.content || fact.content.trim() === '') {
      return { isValid: false, message: '请输入冷知识内容' };
    }
    
    if (fact.content.length < 10) {
      return { isValid: false, message: '冷知识内容至少需要10个字符' };
    }
    
    if (fact.content.length > 500) {
      return { isValid: false, message: '冷知识内容不能超过500个字符' };
    }
    
    if (fact.insectName && fact.insectName.length > 20) {
      return { isValid: false, message: '昆虫名称不能超过20个字符' };
    }
    
    if (fact.displayOrder && (fact.displayOrder < 0 || fact.displayOrder > 9999)) {
      return { isValid: false, message: '显示顺序必须在0-9999之间' };
    }
    
    return { isValid: true, message: '' };
  },

  // 批量删除冷知识
  batchDeleteFacts: function() {
    wx.showModal({
      title: '批量删除',
      content: '此功能正在开发中',
      showCancel: false
    });
  },

  // 导出冷知识数据
  exportFacts: function() {
    wx.showModal({
      title: '数据导出',
      content: '此功能正在开发中',
      showCancel: false
    });
  }
});