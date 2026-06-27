// pages/insect-detail/insect-detail.js
const app = getApp();
const db = wx.cloud.database();

// 昆虫名称标准化映射
const INSECT_NAME_MAP = {
  '螳螂': '螳螂', '眼斑螳螂': '眼斑螳螂', '枯叶螳螂': '枯叶螳螂', 
  '大刀螳螂': '大刀螳螂', '中华螳螂': '中华螳螂', '地鳖': '地鳖',
  '蝴蝶': '蝴蝶', '蜜蜂': '蜜蜂', '蚂蚁': '蚂蚁', '胡蜂': '胡蜂',
  '熊蜂': '熊蜂', '蛾': '蛾', '蜻蜓': '蜻蜓', '豆娘': '豆娘',
  '蟋蟀': '蟋蟀', '蝗虫': '蝗虫', '螽斯': '螽斯', '甲虫': '甲虫',
  '瓢虫': '瓢虫', '天牛': '天牛', '金龟子': '金龟子', '蝉': '蝉',
  '蚱蝉': '蚱蝉', '蟪蛄': '蟪蛄', '蟑螂': '蟑螂', '蠼螋': '蠼螋', '蜈蚣': '蜈蚣'
};

// 工具函数：标准化昆虫名称
function normalizeInsectName(name) {
  return INSECT_NAME_MAP[name] || name;
}

// 工具函数：生成昆虫ID
function generateInsectId(name) {
  const normalizedName = normalizeInsectName(name);
  return normalizedName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
}

// 工具函数：格式化日期
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 缓存键前缀
const CACHE_KEY_PREFIX = 'insect_detail_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时缓存

Page({
  data: {
    insectId: '',
    externalId: '', // 新增externalId字段
    // 分块加载状态管理
    loadingBasicInfo: true,    // 基本信息（头图）加载状态
    loadingDiscoveryRecords: false,  // 发现记录加载状态
    
    // 各模块数据
    insectInfo: {
      name: '',
      imageUrl: '',
      foundCount: 0,
      lastFoundDate: '',
      externalId: '', // 在insectInfo中也保存externalId
      encyclopedia: { // 默认包含encyclopedia字段
        description: '',
        habitat: '',
        food: ''
      }
    },
    discoveryRecords: [],
    
    // 分页和控制信息
    hasMoreRecords: false,
    pageSize: 2,
    currentPage: 0,
    
    // 错误和空状态
    error: '',
    basicInfoError: '',
    discoveryError: '',
    showEmptyState: false,
    
    // 百科信息折叠状态
    encyclopediaExpanded: false,
    needExpandEncyclopedia: false
  },
  
  // 私有变量
  _pageLoadStartTime: null,
  _totalDiscoveryRecords: [],
  _lastDiscoveryRecords: null,
  _blockLoadingTimes: {
    basicInfo: 0,
    discoveryRecords: 0
  },

  onLoad: function(options) {
    this._pageLoadStartTime = Date.now();
    
    // 初始化防重复调用标志
    this._isFetchingBaike = false;
    
    // 检查参数
    if (!options || (!options.id && !options.name)) {
      this.setData({ error: '缺少必要参数', loading: false });
      return;
    }
    
    // 设置昆虫ID和externalId
    // 检查id是否是新的externalId格式（以insect_开头）
    let insectId = '';
    let externalId = '';
    
    if (options.id && options.id.startsWith('insect_')) {
      // 如果是新格式ID，设置为externalId
      externalId = options.id;
      insectId = ''; // 旧格式ID不再使用
    } else if (options.id) {
      // 如果不是新格式ID，可能是旧格式ID或中文名称
      insectId = options.id;
    } else if (options.name) {
      // 如果只有名称，生成旧格式ID
      insectId = generateInsectId(options.name);
    }
    
    this.setData({ 
      insectId,
      externalId // 保存externalId用于后续数据获取
    });
    
    console.log('页面加载参数处理:', { options, insectId, externalId });
    
    // 并行加载数据
    this.loadPageData();
  },
  
  // 核心加载方法 - 实现分块加载策略
  async loadPageData(forceRefresh = false) {
    console.log('开始分块加载页面数据:', this.data.insectId, '强制刷新:', forceRefresh);
    
    // 如果强制刷新，清除缓存
    if (forceRefresh) {
      console.log('执行强制刷新，清除当前缓存');
      this.clearCurrentInsectCache();
    }
    
    // 重置模块加载状态
    this.setData({
      loadingBasicInfo: true,
      loadingDiscoveryRecords: false,
      basicInfoError: '',
      discoveryError: '',
      error: '',
      
      // 初始化基本数据结构
      insectInfo: {
        name: this.data.insectId || '未知昆虫',
        imageUrl: '',
        foundCount: 0,
        lastFoundDate: '',
        externalId: this.data.externalId || ''
      },
      discoveryRecords: []
    });
    
    try {
      // 1. 检查各模块缓存
      const cachedData = this.getCachedData();
      let useCache = false;
      
      if (cachedData) {
        console.log('发现页面缓存，检查缓存有效性');
        // 验证缓存数据是否完整
        if (cachedData.insectInfo && cachedData.insectInfo.name && 
            (cachedData.insectInfo.description || cachedData.insectInfo.encyclopedia?.description)) {
          console.log('缓存数据完整，开始恢复页面数据');
          this.updatePageWithCachedData(cachedData);
          useCache = true;
        } else {
          console.log('缓存数据不完整，需要重新加载');
          // 清除不完整的缓存
          this.clearCurrentInsectCache();
        }
      }
      
      if (useCache) {
        // 检查各模块缓存是否过期
        const cacheAge = Date.now() - cachedData.timestamp;
        const shouldRefresh = cacheAge > 2 * 60 * 60 * 1000; // 2小时
        
        if (shouldRefresh) {
          console.log('缓存超过2小时，异步刷新数据');
          // 异步刷新所有模块
          this.refreshDataAsync(true).catch(err => console.warn('异步刷新数据失败:', err));
        }
        
        // 标记所有模块加载完成
        this.setData({
          loadingBasicInfo: false,
          loadingDiscoveryRecords: false,
          fetchingBaike: false
        });
        return;
      }
      
      console.log('没有有效缓存，开始分块加载新数据');
      
      // 2. 使用并行加载策略以确保数据完整性
      try {
        // 并行加载以提高性能
        await Promise.all([
          this.loadBasicInfo(),
          this.loadDiscoveryRecords()
        ]);
        
        // 确保头图正确设置：如果基本信息没有头图，但发现记录中有，使用第一条记录的图片
        if (!this.data.insectInfo.imageUrl && this._totalDiscoveryRecords && this._totalDiscoveryRecords.length > 0) {
          this.setData({
            'insectInfo.imageUrl': this._totalDiscoveryRecords[0].userImageUrl || ''
          });
          console.log('初始化时使用发现记录中的图片作为头图');
        }
      } catch (parallelError) {
        console.error('并行加载数据失败:', parallelError);
        // 即使并行加载失败，也尝试单独加载每个模块
        try {
          await this.loadBasicInfo();
          await this.loadDiscoveryRecords();
        } catch (fallbackError) {
          console.error('回退加载也失败:', fallbackError);
        }
      }
      
      // 3. 保存完整缓存
      this.saveDataToCache();
      
      // 额外检查：如果页面加载完成后仍然没有发现记录，再次尝试加载
      if (!this.data.discoveryRecords || this.data.discoveryRecords.length === 0) {
        setTimeout(() => {
          console.log('额外检查：尝试重新加载发现记录');
          this.loadDiscoveryRecords().catch(err => console.warn('额外加载发现记录失败:', err));
        }, 1000);
      }
    } catch (error) {
      console.error('页面数据加载异常:', error);
      this.setData({ error: '加载失败，请重试' });
      // 出错时也确保页面有基本显示
      if (!this.data.insectInfo.name) {
        this.setData({
          'insectInfo.name': this.data.insectId
        });
      }
    } finally {
      this.setData({
        loadingBasicInfo: false,
        loadingDiscoveryRecords: false
      });
    }
  },
  
  // 分块加载：基本信息（头图）
  async loadBasicInfo() {
    try {
      console.log('开始加载基本信息块');
      this.setData({ loadingBasicInfo: true, basicInfoError: '' });
      this._blockLoadingTimes.basicInfo++;
      
      // 添加try-catch内部错误捕获，确保即使数据结构有问题也不会影响整个页面
      const insectDetail = await this.fetchInsectDetail().catch(err => {
        console.error('获取昆虫详情失败:', { code: err.code, message: err.message });
        this.setData({ basicInfoError: '加载基本信息失败' });
        return {
          name: this.data.insectId,
          imageUrl: '',
          foundCount: 0,
          lastFoundDate: '',
          externalId: this.data.externalId || '',
          encyclopedia: {  // 确保返回encyclopedia字段
            description: '',
            habitat: '',
            food: ''
          }
        };
      });
      
      // 更新昆虫信息
      if (insectDetail) {
        const updatedInsectInfo = {
          name: insectDetail.name || this.data.insectId,
          imageUrl: insectDetail.imageUrl || '',
          foundCount: insectDetail.foundCount || 0,
          lastFoundDate: insectDetail.lastFoundDate || '',
          externalId: insectDetail.externalId || this.data.externalId || '',
          // 保存顶层的百科信息字段
          description: insectDetail.description || '',
          habitat: insectDetail.habitat || '',
          food: insectDetail.food || '',
          encyclopedia: insectDetail.encyclopedia || { // 确保encyclopedia存在
            description: '',
            habitat: '',
            food: ''
          }
        };
        
        this.setData({ 
          insectInfo: updatedInsectInfo,
          // 更新页面级的externalId，确保一致性
          externalId: insectDetail.externalId || this.data.externalId || ''
        });
        console.log('基本信息加载完成，externalId:', updatedInsectInfo.externalId);
        
        // 检查百科信息是否需要折叠
        this.checkEncyclopediaLength();
      }
    } catch (error) {
      console.error('基本信息块加载异常:', error);
      this.setData({ basicInfoError: '加载基本信息异常' });
    } finally {
      this.setData({ loadingBasicInfo: false });
      console.log(`基本信息块加载完成，耗时: ${Date.now() - (this._pageLoadStartTime || Date.now())}ms`);
    }
  },
  
  // 分块加载：发现记录
  async loadDiscoveryRecords() {
    try {
      console.log('开始加载发现记录块，昆虫ID:', this.data.insectId);
      this.setData({ loadingDiscoveryRecords: true, discoveryError: '' });
      this._blockLoadingTimes.discoveryRecords++;
      
      // 清除之前可能存在的记录，确保获取最新数据
      this._totalDiscoveryRecords = [];
      
      // 尝试获取发现记录，添加更多错误处理
      const discoveryRecords = await this.fetchDiscoveryRecords().catch(err => {
        console.error('获取发现记录失败:', { code: err?.code, message: err?.message, stack: err?.stack });
        this.setData({ discoveryError: '加载发现记录失败' });
        return [];
      });
      
      // 增强的安全检查和处理
      if (!Array.isArray(discoveryRecords)) {
        console.warn('发现记录数据格式异常，期望数组:', typeof discoveryRecords);
        this._totalDiscoveryRecords = [];
      } else {
        // 确保记录数组不为null且完全复制
        this._totalDiscoveryRecords = [...(discoveryRecords || [])];
        console.log('获取到发现记录数量:', this._totalDiscoveryRecords.length);
        
        // 如果有发现记录图片且没有设置头图，设置为头图
        if (!this.data.insectInfo.imageUrl && this._totalDiscoveryRecords.length > 0 && this._totalDiscoveryRecords[0].userImageUrl) {
          this.setData({
            'insectInfo.imageUrl': this._totalDiscoveryRecords[0].userImageUrl
          });
          console.log('使用发现记录中的图片作为头图:', this._totalDiscoveryRecords[0].userImageUrl);
        }
        
        // 特殊处理：如果发现记录数量少于foundCount，尝试重新获取
        if (this.data.insectInfo.foundCount > 0 && this._totalDiscoveryRecords.length === 0) {
          console.warn('发现统计数量不为0但没有记录，尝试重新获取', { foundCount: this.data.insectInfo.foundCount });
          // 延迟1秒后重试，避免频繁请求
          setTimeout(() => {
            this.loadDiscoveryRecords();
          }, 1000);
        }
      }
      
      // 强制更新显示，确保UI与最新数据同步
      this.updateDisplayedRecords();
      
      // 强制触发UI更新
      this.setData({ 
        discoveryRecords: [...this.data.discoveryRecords], // 强制数组更新
        hasMoreRecords: this.data.hasMoreRecords 
      });
      
      // 保存更新后的数据到缓存
      this.saveDataToCache();
      
      console.log('发现记录加载完成并同步到UI，当前显示条数:', this.data.discoveryRecords?.length || 0);
      
      // 如果仍然没有记录，显示空状态提示
      if (this.data.discoveryRecords.length === 0 && !this.data.discoveryError) {
        this.setData({ showEmptyState: true });
        console.log('设置空状态显示');
      } else {
        this.setData({ showEmptyState: false });
      }
    } catch (error) {
      console.error('发现记录块加载异常:', { message: error.message, stack: error.stack });
      this.setData({ 
        discoveryError: '加载发现记录异常',
        discoveryRecords: [], // 出错时确保显示空数组
        showEmptyState: true
      });
      this._totalDiscoveryRecords = [];
    } finally {
      this.setData({ loadingDiscoveryRecords: false });
      console.log(`发现记录块加载完成，耗时: ${Date.now() - (this._pageLoadStartTime || Date.now())}ms`);
    }
  },
  

  
  // 刷新基本信息
  async refreshBasicInfo() {
    try {
      const insectDetail = await this.fetchInsectDetail();
      if (insectDetail) {
        // 确保更新所有字段，包括百科信息
        const updatedInsectInfo = {
          name: insectDetail.name || this.data.insectInfo.name,
          imageUrl: insectDetail.imageUrl || this.data.insectInfo.imageUrl,
          foundCount: insectDetail.foundCount || this.data.insectInfo.foundCount,
          lastFoundDate: insectDetail.lastFoundDate || this.data.insectInfo.lastFoundDate,
          externalId: insectDetail.externalId || this.data.insectInfo.externalId,
          // 确保更新百科信息相关字段
          description: insectDetail.description || this.data.insectInfo.description || '',
          habitat: insectDetail.habitat || this.data.insectInfo.habitat || '',
          food: insectDetail.food || this.data.insectInfo.food || '',
          encyclopedia: insectDetail.encyclopedia || this.data.insectInfo.encyclopedia || {
            description: '',
            habitat: '',
            food: ''
          }
        };
        
        this.setData({ insectInfo: updatedInsectInfo });
        this.saveDataToCache();
        console.log('基本信息已刷新，包括百科信息');
        
        // 检查百科信息是否需要折叠
        this.checkEncyclopediaLength();
      }
    } catch (error) {
      console.warn('刷新基本信息失败，保留现有数据:', error);
    }
  },
  
  // 刷新发现记录
  async refreshDiscoveryRecords() {
    try {
      const discoveryRecords = await this.fetchDiscoveryRecords();
      if (discoveryRecords && discoveryRecords.length >= 0) {
        if (JSON.stringify(discoveryRecords) !== JSON.stringify(this._totalDiscoveryRecords)) {
          this._totalDiscoveryRecords = discoveryRecords;
          this.updateDisplayedRecords();
          this.saveDataToCache();
          console.log('发现记录已刷新');
        }
      }
    } catch (error) {
      console.warn('刷新发现记录失败，保留现有数据:', error);
    }
  },
  

  
  // 异步刷新数据（保留向后兼容）
  async refreshDataAsync(forceRefresh = false) {
    console.log('调用兼容版刷新方法，使用分块刷新替代');
    
    if (forceRefresh) {
      // 强制刷新时，刷新所有模块
      await Promise.all([
        this.refreshBasicInfo(),
        this.refreshDiscoveryRecords()
      ]);
    } else {
      // 普通刷新只更新基本信息
      await this.refreshBasicInfo();
    }
  },
  
  // 从缓存获取数据
  getCachedData() {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${this.data.insectId}`;
      const cachedData = wx.getStorageSync(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY)) {
        return cachedData;
      }
    } catch (e) {
      console.warn('读取缓存失败:', e);
    }
    return null;
  },
  
  // 清除当前昆虫的缓存
  clearCurrentInsectCache() {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${this.data.insectId}`;
      wx.removeStorageSync(cacheKey);
      console.log('成功清除当前昆虫的缓存:', cacheKey);
      return true;
    } catch (e) {
      console.error('清除缓存失败:', e);
      return false;
    }
  },
  
  // 使用缓存数据更新页面
  updatePageWithCachedData(cachedData) {
    if (!cachedData) return;
    
    if (cachedData.insectInfo) {
      // 确保缓存的数据包含完整的insectInfo结构
      const completeInsectInfo = {
        name: '',
        imageUrl: '',
        foundCount: 0,
        lastFoundDate: '',
        externalId: '',
        description: '',
        habitat: '',
        food: '',
        encyclopedia: {
          description: '',
          habitat: '',
          food: ''
        },
        ...cachedData.insectInfo
      };
      this.setData({ insectInfo: completeInsectInfo });
      console.log('从缓存恢复页面数据，包括百科信息');
    }
    
    if (cachedData.discoveryRecords) {
      this._totalDiscoveryRecords = cachedData.discoveryRecords;
      this.updateDisplayedRecords();
    }
  },
  
  // 保存数据到缓存
  saveDataToCache() {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${this.data.insectId}`;
      const cacheData = {
        timestamp: Date.now(),
        insectInfo: this.data.insectInfo,
        discoveryRecords: this._totalDiscoveryRecords
      };
      wx.setStorageSync(cacheKey, cacheData);
    } catch (e) {
      console.warn('保存缓存失败:', e);
    }
  },
  
  // 获取昆虫基本信息
  async fetchInsectDetail() {
    try {
      // 优先使用externalId进行查询
      const queryKey = this.data.externalId ? 'externalId' : 'insectId';
      const queryValue = this.data.externalId || this.data.insectId;
      
      console.log(`开始获取昆虫详情:`, { [queryKey]: queryValue });
      // 保存当前完整数据，确保不丢失任何信息
      const currentInsectInfo = this.data.insectInfo || {};
      
      // 添加超时保护
      const timeoutPromise = new Promise(resolve => setTimeout(() => {
        console.warn(`获取昆虫详情超时:`, { [queryKey]: queryValue });
        // 超时返回包含当前所有已有信息的数据，保留现有名称
        resolve({
          result: {
            ...currentInsectInfo,
            name: currentInsectInfo.name || this.data.insectId
          }
        });
      }, 3000));
      
      // 构建云函数调用参数，优先使用externalId
      const fetchData = {};
      fetchData[queryKey] = queryValue;
      
      const fetchPromise = wx.cloud.callFunction({
        name: 'getInsectDetail',
        data: fetchData
      });
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('获取昆虫详情结果:', result?.result);
      
      // 处理返回结果，确保保留现有数据
      const insectDetail = result?.result || {};
      return {
        name: insectDetail.name || this.data.insectId,
        imageUrl: insectDetail.imageUrl || currentInsectInfo.imageUrl || '',
        foundCount: insectDetail.foundCount || currentInsectInfo.foundCount || 0,
        lastFoundDate: insectDetail.lastFoundDate || currentInsectInfo.lastFoundDate || '',
        externalId: insectDetail.externalId || this.data.externalId || '',
        description: insectDetail.description || currentInsectInfo.description || '',
        habitat: insectDetail.habitat || currentInsectInfo.habitat || '',
        food: insectDetail.food || currentInsectInfo.food || '',
        // 确保保留完整的百科信息
        encyclopedia: {
          description: insectDetail.encyclopedia?.description || currentInsectInfo.encyclopedia?.description || '',
          habitat: insectDetail.encyclopedia?.habitat || currentInsectInfo.encyclopedia?.habitat || '',
          food: insectDetail.encyclopedia?.food || currentInsectInfo.encyclopedia?.food || ''
        }
      };
    } catch (error) {
      console.warn('获取昆虫详情失败:', error);
      // 返回包含当前所有已有信息的数据
      const currentInsectInfo = this.data.insectInfo || {};
      return {
        name: this.data.insectId,
        imageUrl: currentInsectInfo.imageUrl || '',
        foundCount: currentInsectInfo.foundCount || 0,
        lastFoundDate: currentInsectInfo.lastFoundDate || '',
        description: currentInsectInfo.description || '',
        habitat: currentInsectInfo.habitat || '',
        food: currentInsectInfo.food || '',
        // 确保保留完整的百科信息
        encyclopedia: {
          description: currentInsectInfo.encyclopedia?.description || '',
          habitat: currentInsectInfo.encyclopedia?.habitat || '',
          food: currentInsectInfo.encyclopedia?.food || ''
        }
      };
    }
  },
  
  // 获取发现记录 - 支持新的ID系统，优先使用externalId
  async fetchDiscoveryRecords() {
    try {
      console.log('开始获取发现记录:', {insectId: this.data.insectId, externalId: this.data.externalId});
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 构建查询条件，优先使用externalId
      let queryCondition = {};
      if (this.data.externalId && this.data.externalId.startsWith('insect_')) {
        queryCondition = {
          externalId: this.data.externalId
        };
        console.log('使用externalId查询发现记录');
      } else {
        queryCondition = {
          insectId: this.data.insectId
        };
        console.log('使用insectId查询发现记录');
      }
      
      // 使用更详细的查询，添加排序和更多日志
      const queryResult = await db.collection('user_insects')
        .where(queryCondition)
        .orderBy('lastFoundTime', 'desc')
        .get();
      
      console.log('查询结果完整信息:', {
        data: queryResult.data,
        errMsg: queryResult.errMsg,
        totalCount: queryResult.data ? queryResult.data.length : 0
      });
      
      // 使用Map进行高效去重，确保不重复添加记录
      const uniqueRecordsMap = new Map();
      let totalRecordsProcessed = 0;
      let totalFoundRecordsCount = 0;
      
      // 检查数据是否存在
      if (queryResult && queryResult.data && queryResult.data.length > 0) {
        console.log('发现记录数据数量:', queryResult.data.length);
        
        // 遍历所有匹配的文档
        for (const userInsect of queryResult.data) {
          console.log(`处理文档: _id=${userInsect._id}, foundCount=${userInsect.foundCount}, lastFoundTime=${userInsect.lastFoundTime}`);
          const userImageUrl = userInsect.userImageUrl || '';
          
          // 处理主记录数组 - 更详细的日志和安全检查
          if (userInsect.foundRecords && Array.isArray(userInsect.foundRecords)) {
            console.log(`文档 ${userInsect._id} 包含 foundRecords 数组，长度: ${userInsect.foundRecords.length}`);
            totalFoundRecordsCount += userInsect.foundRecords.length;
            
            for (const record of userInsect.foundRecords) {
              totalRecordsProcessed++;
              // 为记录添加userImageUrl
              if (!record.userImageUrl) {
                record.userImageUrl = userImageUrl;
              }
              
              // 使用确定性的唯一键，移除随机因子
              // 使用更多字段确保唯一性，但避免随机因子导致的不一致性
              const key = `${record._id || ''}-${record.userImageUrl}-${record.time}-${record.location || ''}`;
              uniqueRecordsMap.set(key, record);
              console.log('添加记录:', {key, time: record.time, from: 'foundRecords'});
            }
          } else {
            console.log(`文档 ${userInsect._id} 没有有效 foundRecords 数组:`, typeof userInsect.foundRecords);
          }
          
          // 处理旧记录
          if (userInsect.oldFoundRecords && Array.isArray(userInsect.oldFoundRecords)) {
            console.log(`文档 ${userInsect._id} 包含 oldFoundRecords 数组，长度: ${userInsect.oldFoundRecords.length}`);
            totalFoundRecordsCount += userInsect.oldFoundRecords.length;
            
            for (const oldRecord of userInsect.oldFoundRecords) {
              totalRecordsProcessed++;
              // 为记录添加userImageUrl
              if (!oldRecord.userImageUrl) {
                oldRecord.userImageUrl = userImageUrl;
              }
              
              // 使用确定性的唯一键
              const key = `${oldRecord._id || ''}-${oldRecord.userImageUrl}-${oldRecord.time}-${oldRecord.location || ''}`;
              uniqueRecordsMap.set(key, oldRecord);
              console.log('添加旧记录:', {key, time: oldRecord.time, from: 'oldFoundRecords'});
            }
          }
        }
        
        console.log('发现记录统计:', {
          totalDocuments: queryResult.data.length,
          totalRecordsInArrays: totalFoundRecordsCount,
          totalProcessedRecords: totalRecordsProcessed,
          uniqueRecordsAfterDedupe: uniqueRecordsMap.size
        });
      } else {
        console.log('未找到发现记录');
      }
      
      // 转换回数组并按时间降序排序
      let foundRecords = Array.from(uniqueRecordsMap.values()).sort((a, b) => {
        const timeA = a.time ? new Date(a.time) : new Date(0);
        const timeB = b.time ? new Date(b.time) : new Date(0);
        return timeB - timeA;
      });
      
      console.log('去重后的发现记录数量:', foundRecords.length);
      
      // 格式化记录时间和添加缩略图URL
      foundRecords = foundRecords.map(record => ({
        ...record,
        id: record.id || record._id || `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        formattedTime: record.time ? formatDate(record.time) : '未知时间',
        thumbnailUrl: this.getThumbnailUrl(record.userImageUrl),
        originalImageUrl: record.userImageUrl
      }));
      
      // 不缓存结果，确保每次都获取最新数据
      this._lastDiscoveryRecords = foundRecords;
      
      // 添加额外的诊断信息
      if (foundRecords.length === 0 && queryResult.data && queryResult.data.length > 0) {
        console.warn('警告：查询到文档但没有有效的发现记录');
        // 尝试从文档本身创建发现记录，作为后备方案
        for (const userInsect of queryResult.data) {
          if (userInsect.userImageUrl) {
            const fallbackRecord = {
              id: `fallback_${userInsect._id}`,
              time: userInsect.lastFoundTime || userInsect.createdAt,
              userImageUrl: userInsect.userImageUrl,
              location: '',
              description: '',
              formattedTime: userInsect.lastFoundTime ? formatDate(userInsect.lastFoundTime) : '未知时间',
              thumbnailUrl: this.getThumbnailUrl(userInsect.userImageUrl),
              originalImageUrl: userInsect.userImageUrl
            };
            foundRecords.push(fallbackRecord);
            console.log('创建后备记录:', fallbackRecord);
          }
        }
      }
      
      console.log('最终返回的发现记录数量:', foundRecords.length);
      return foundRecords;
    } catch (error) {
      console.error('获取发现记录错误:', error);
      // 出错时返回空数组，避免使用可能过时的缓存
      return [];
    }
  },
  
  // 更新显示的记录（分页）
  updateDisplayedRecords() {
    try {
      // 安全检查，确保_totalDiscoveryRecords是数组
      if (!Array.isArray(this._totalDiscoveryRecords)) {
        console.warn('发现记录数据异常，重置为空数组');
        this._totalDiscoveryRecords = [];
      }
      
      const endIndex = (this.data.currentPage + 1) * this.data.pageSize;
      const currentRecords = this._totalDiscoveryRecords.slice(0, endIndex);
      
      // 检查是否需要更新UI，避免不必要的重渲染
      if (JSON.stringify(currentRecords) !== JSON.stringify(this.data.discoveryRecords)) {
        console.log('更新发现记录显示，当前显示条数:', currentRecords.length);
        this.setData({
          discoveryRecords: currentRecords,
          hasMoreRecords: endIndex < this._totalDiscoveryRecords.length
        });
      }
    } catch (error) {
      console.error('更新显示记录失败:', error);
      // 重置为安全状态
      this.setData({
        discoveryRecords: [],
        hasMoreRecords: false
      });
    }
  },
  
  // 获取缩略图URL
  getThumbnailUrl(imageUrl) {
    if (!imageUrl) return '';
    // 简单的缩略图处理，实际项目中可根据云存储服务调整
    return imageUrl.includes('cloud://') ? imageUrl + '?imageMogr2/thumbnail/200x200' : imageUrl;
  },
  

  
  // 检查并设置用户OpenID
  async checkAndSetOpenid() {
    try {
      const app = getApp();
      if (!app.globalData.openid) {
        const result = await wx.cloud.callFunction({ name: 'getOpenId' });
        if (result.result?.openid) {
          app.globalData.openid = result.result.openid;
        }
      }
    } catch (error) {
      console.warn('获取OpenID失败，但不影响页面加载');
    }
  },
  

  
  // 下拉刷新处理 - 修复头图消失问题和发现记录同步问题
  onPullDownRefresh: function() {
    // 下拉刷新时强制清除缓存并重新加载
    // 重要：保存当前的昆虫信息，特别是头图数据
    console.log('触发下拉刷新');
    
    // 重要：保存当前的昆虫信息，特别是头图数据
    const currentInsectInfo = { ...this.data.insectInfo };
    
    // 清除缓存，强制获取最新数据
    try {
      // 优先使用externalId作为缓存键
      const cacheKey = this.data.externalId ? `${CACHE_KEY_PREFIX}${this.data.externalId}` : `${CACHE_KEY_PREFIX}${this.data.insectId}`;
      wx.removeStorageSync(cacheKey);
      console.log('缓存已清除');
    } catch (e) {
      console.warn('清除缓存失败:', e);
    }
    
    // 重置状态，但保留insectInfo
    this.setData({
      error: '',
      showEmptyState: false,
      discoveryRecords: [], // 清空记录以便重新加载
      loadingBasicInfo: true,
      loadingDiscoveryRecords: true // 同时加载发现记录
    });
    
    // 确保insectInfo数据保持完整
    this.setData({ insectInfo: currentInsectInfo });
    
    // 分步加载数据，优化加载顺序
    const refreshData = async () => {
      try {
        // 并行加载基本信息和发现记录，提高性能
        const [insectDetail, discoveryRecords] = await Promise.all([
          this.fetchInsectDetail(),
          this.fetchDiscoveryRecords()
        ]);
        
        // 合并基本信息，确保保留所有字段，特别是百科信息
        const updatedInsectInfo = {
          ...currentInsectInfo, // 保留所有现有字段
          name: insectDetail.name || currentInsectInfo.name,
          imageUrl: insectDetail.imageUrl || currentInsectInfo.imageUrl,
          foundCount: insectDetail.foundCount || currentInsectInfo.foundCount || 0,
          lastFoundDate: insectDetail.lastFoundDate || currentInsectInfo.lastFoundDate || '',
          description: insectDetail.description || currentInsectInfo.description || '',
          habitat: insectDetail.habitat || currentInsectInfo.habitat || '',
          food: insectDetail.food || currentInsectInfo.food || '',
          // 合并百科信息
          encyclopedia: {
            ...(currentInsectInfo.encyclopedia || {}),
            ...(insectDetail.encyclopedia || {})
          }
        };
        
        // 如果基本信息没有头图，但发现记录中有图片，使用第一条记录的图片作为头图
        if (!updatedInsectInfo.imageUrl && discoveryRecords && discoveryRecords.length > 0) {
          updatedInsectInfo.imageUrl = discoveryRecords[0].userImageUrl || '';
          console.log('使用发现记录中的图片作为头图');
        }
        
        // 更新数据
        this._totalDiscoveryRecords = discoveryRecords || [];
        this.setData({
          insectInfo: updatedInsectInfo,
          discoveryRecords: this._totalDiscoveryRecords.slice(0, this.data.pageSize),
          hasMoreRecords: this._totalDiscoveryRecords.length > this.data.pageSize
        });
        
        console.log('下拉刷新数据加载完成，发现记录数量:', discoveryRecords.length);
      } catch (error) {
        console.error('下拉刷新数据加载失败:', error);
        // 出错时恢复原始数据
        this.setData({
          error: '刷新失败，请重试',
          insectInfo: currentInsectInfo,
          discoveryRecords: [],
          hasMoreRecords: false
        });
      } finally {
        this.setData({
          loadingBasicInfo: false,
          loadingDiscoveryRecords: false
        });
        wx.stopPullDownRefresh();
        console.log('下拉刷新动画已停止');
      }
    };
    
    // 执行刷新
    refreshData();
  },
  
  // 加载更多记录
  loadMoreRecords: function() {
    this.setData({ currentPage: this.data.currentPage + 1 });
    this.updateDisplayedRecords();
  },
  
  // 预览图片
  previewImage: function() {
    const imageUrl = this.data.insectInfo.imageUrl || '/images/default_insect.png';
    wx.previewImage({ urls: [imageUrl], current: imageUrl });
  },
  
  // 预览发现记录图片
  previewDiscoveryImage: function(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({ urls: [url], current: url });
    }
  },
  
  // 处理图片加载错误
  handleImageError: function(e) {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      this.setData({
        [`discoveryRecords[${index}].thumbnailUrl`]: '/images/default_insect.png',
        [`discoveryRecords[${index}].userImageUrl`]: '/images/default_insect.png'
      });
    }
  },
  
  // 重试加载
  retryLoad: function() {
    this.setData({ 
      loading: true, 
      error: '',
      showEmptyState: false 
    });
    this.loadPageData();
  },
  
  // 切换百科信息折叠状态
  toggleEncyclopedia: function() {
    this.setData({
      encyclopediaExpanded: !this.data.encyclopediaExpanded
    });
  },
  
  // 检查百科信息是否需要折叠（超过6行）
  checkEncyclopediaLength: function() {
    const description = this.data.insectInfo.description || this.data.insectInfo.encyclopedia.description || '';
    // 估算行数，假设每行平均30个汉字
    const estimatedLines = Math.ceil(description.length / 30);
    this.setData({
      needExpandEncyclopedia: estimatedLines > 6
    });
  }
});