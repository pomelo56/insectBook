// miniprogram/pages/admin/users/users.js
Page({
  data: {
    users: [],
    loading: true,
    pageSize: 20,
    pageNum: 1,
    hasMore: true,
    searchKey: '',
    filterOptions: [
      { name: '全部用户', value: 'all' },
      { name: '活跃用户', value: 'active' },
      { name: '新用户', value: 'new' }
    ],
    currentFilter: 'all',
    sortOptions: [
      { name: '注册时间', value: 'registerTime' },
      { name: '收集数量', value: 'collectedCount' },
      { name: '等级', value: 'level' }
    ],
    currentSort: 'registerTime',
    sortOrder: 'desc'
  },

  onLoad: function() {
    this.loadUsers();
  },

  // 加载用户列表
  loadUsers: async function(loadMore = false) {
    console.log('加载用户列表函数被调用');
    if (!loadMore) {
      this.setData({ loading: true, pageNum: 1 });
    }

    try {
      // 检查云开发环境是否初始化
      if (!wx.cloud) {
        throw new Error('云开发环境未初始化，请检查基础库版本');
      }
      
      console.log('准备调用云函数 getUserList');
      console.log('调用参数:', {
        pageNum: loadMore ? this.data.pageNum + 1 : 1,
        pageSize: this.data.pageSize,
        searchKey: this.data.searchKey,
        filter: this.data.currentFilter,
        sortBy: this.data.currentSort,
        sortOrder: this.data.sortOrder
      });
      
      // 记录调用开始时间
      const startTime = Date.now();
      
      const callResult = await wx.cloud.callFunction({
        name: 'getUserList',
        data: {
          pageNum: loadMore ? this.data.pageNum + 1 : 1,
          pageSize: this.data.pageSize,
          searchKey: this.data.searchKey,
          filter: this.data.currentFilter,
          sortBy: this.data.currentSort,
          sortOrder: this.data.sortOrder,
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
      if (result.success === false) {
        throw new Error(result.error || '云函数执行失败');
      }

      const users = result.users || [];
      const hasMore = users.length === this.data.pageSize;

      this.setData({
        users: loadMore ? [...this.data.users, ...users] : users,
        loading: false,
        hasMore: hasMore,
        pageNum: loadMore ? this.data.pageNum + 1 : 1
      });
      
      console.log('用户列表加载成功，共加载', users.length, '条数据');
    } catch (error) {
      console.error('加载用户列表失败 - 详细错误信息:', error);
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
          content: '请确保云函数 getUserList 已正确部署到环境 cloud1-8ggzed032ed5e7ec\n\n错误详情: ' + errorMessage,
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

  // 搜索用户
  onSearch: function(e) {
    this.setData({ searchKey: e.detail.value });
    this.loadUsers();
  },

  // 过滤用户
  onFilterChange: function(e) {
    this.setData({ currentFilter: e.detail.value });
    this.loadUsers();
  },

  // 排序用户
  onSortChange: function(e) {
    const sortBy = e.detail.value;
    let sortOrder = 'desc';
    
    // 如果点击的是当前排序字段，则切换排序顺序
    if (sortBy === this.data.currentSort) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }
    
    this.setData({ currentSort: sortBy, sortOrder: sortOrder });
    this.loadUsers();
  },

  // 查看用户详情
  viewUserDetail: function(e) {
    console.log('查看用户详情被调用');
    const userId = e.currentTarget.dataset.id;
    console.log('用户ID:', userId);
    
    // 由于user-detail页面不存在，暂时显示用户ID信息
    wx.showModal({
      title: '用户详情',
      content: `用户ID: ${userId}`,
      showCancel: false
    });
    
    /*
    wx.navigateTo({
      url: `/pages/admin/users/user-detail?id=${userId}`,
      fail: function(error) {
        console.error('导航到用户详情页失败:', error);
        wx.showToast({
          title: '用户详情页面不存在',
          icon: 'none'
        });
      }
    });
    */
  },

  // 上拉加载更多
  onReachBottom: function() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadUsers(true);
    }
  },

  // 刷新页面
  onPullDownRefresh: function() {
    this.loadUsers();
    wx.stopPullDownRefresh();
  }
});