// 昆虫详情页 - 重构版
Page({
  data: {
    // 基本信息
    id: '',
    name: '',
    normalizedName: '',
    insectId: '',
    imageUrl: '',
    location: {
      latitude: 0,
      longitude: 0,
      address: ''
    },
    // 用户记录相关
    foundCount: 0,
    lastFoundTime: '',
    lastFoundDate: '',
    notesList: [],
    // 百科信息
    baikeContent: '',
    classificationInfo: {},
    // UI状态
    loading: true,
    error: '',
    isNewDiscovery: false,
    cacheHit: false,
    // 系统信息
    openid: '',
    totalFound: 0,
    totalInsects: 0,
    // 内部状态
    _originalFoundCount: 0,
    _isPullDownRefresh: false,
    _fromCamera: false
  },

  // 昆虫名称标准化映射表
  insectNameMap: {
    '蝴蝶': ['胡蝶', '蝶', '蛱蝶', '凤蝶', '粉蝶'],
    '蜜蜂': ['蜂', '蜜糖蜂', '小蜜蜂'],
    '蜻蜓': ['蜻蛉', '豆娘'],
    '苍蝇': ['蝇', '家蝇', '果蝇'],
    '蚊子': ['蚊', '疟蚊', '库蚊'],
    '蟑螂': ['蜚蠊', '小强', '甲由'],
    '蚂蚁': ['蚁', '白蚁'],
    '蚂蚱': ['蝗虫', '蚱蜢'],
    '蝉': ['知了', '蝉蜕'],
    '甲虫': ['金龟子', '天牛', '独角仙'],
    '蜘蛛': ['蛛', '圆蛛', '跳蛛'],
    '蟋蟀': ['蛐蛐', '促织'],
    '螳螂': ['刀螂', '祷告虫'],
    '萤火虫': ['流萤', '夜光虫'],
    '毛毛虫': ['毛虫', '刺毛虫'],
    '虱子': ['虱', '体虱'],
    '跳蚤': ['蚤'],
    '蚜虫': ['腻虫', '蜜虫'],
    '飞蛾': ['蛾', '夜蛾'],
    '竹节虫': ['虫修'],
    '椿象': ['臭虫', '放屁虫'],
    '书虱': ['书虫']
  },

  // 预设昆虫图片URL映射表
  presetImageUrls: {
    '蝴蝶': 'https://example.com/butterfly.jpg',
    '蜜蜂': 'https://example.com/bee.jpg',
    '蜻蜓': 'https://example.com/dragonfly.jpg',
    '苍蝇': 'https://example.com/fly.jpg',
    '蚊子': 'https://example.com/mosquito.jpg',
    '蟑螂': 'https://example.com/cockroach.jpg',
    '蚂蚁': 'https://example.com/ant.jpg',
    '蚂蚱': 'https://example.com/grasshopper.jpg',
    '蝉': 'https://example.com/cicada.jpg',
    '甲虫': 'https://example.com/beetle.jpg',
    '蜘蛛': 'https://example.com/spider.jpg',
    '蟋蟀': 'https://example.com/cricket.jpg',
    '螳螂': 'https://example.com/mantis.jpg',
    '萤火虫': 'https://example.com/firefly.jpg',
    '毛毛虫': 'https://example.com/caterpillar.jpg',
    '虱子': 'https://example.com/louse.jpg',
    '跳蚤': 'https://example.com/flea.jpg',
    '蚜虫': 'https://example.com/aphid.jpg',
    '飞蛾': 'https://example.com/moth.jpg',
    '竹节虫': 'https://example.com/stick_insect.jpg',
    '椿象': 'https://example.com/stink_bug.jpg',
    '书虱': 'https://example.com/book_louse.jpg'
  },

  // 生命周期函数
  onLoad(options) {
    this.initPageData(options);
    this.waitForOpenidAndLoadData();
  },

  // 初始化页面数据
  initPageData(options) {
    this.setData({
      id: options.id || '',
      name: options.name || '',
      imageUrl: options.imageUrl || '',
      _fromCamera: options.fromCamera === 'true'
    });
  },

  // 等待获取openid并加载数据
  waitForOpenidAndLoadData() {
    this.setData({ loading: true });
    
    const checkOpenid = () => {
      const app = getApp();
      const openid = app.globalData.openid;
      
      if (openid) {
        this.setData({ openid });
        this.loadInsectDetail();
      } else {
        setTimeout(() => {
          checkOpenid();
        }, 300);
      }
    };
    
    checkOpenid();
  },

  // 加载昆虫详情 - 核心流程
  async loadInsectDetail() {
    try {
      // 1. 标准化昆虫名称和ID
      this.normalizeInsectInfo();
      
      // 2. 尝试从缓存获取数据
      const cachedData = this.getCachedData();
      
      // 3. 决定数据来源：缓存或云端
      if (cachedData && !this.data._isPullDownRefresh) {
        this.handleCacheHit(cachedData);
      } else {
        await this.fetchDataFromCloud();
      }
      
      // 4. 补充获取分类信息和百科内容
      this.enrichInsectData();
      
    } catch (error) {
      this.handleError(error, '加载昆虫信息失败');
    } finally {
      this.setData({ loading: false });
      if (this.data._isPullDownRefresh) {
        wx.stopPullDownRefresh();
      }
    }
  },

  // 标准化昆虫名称和ID
  normalizeInsectInfo() {
    const { name } = this.data;
    const normalizedName = this.getNormalizedInsectName(name);
    const insectId = this.generateInsectId(normalizedName);
    
    this.setData({ normalizedName, insectId });
  },

  // 获取标准化昆虫名称
  getNormalizedInsectName(name) {
    if (!name) return '';
    
    const lowerName = name.toLowerCase();
    for (const [standardName, aliases] of Object.entries(this.insectNameMap)) {
      if (lowerName === standardName.toLowerCase() || 
          aliases.some(alias => lowerName.includes(alias.toLowerCase()))) {
        return standardName;
      }
    }
    return name;
  },

  // 生成统一昆虫ID
  generateInsectId(name) {
    if (!name) return '';
    return `insect_${name.replace(/\s+/g, '_').toLowerCase()}`;
  },

  // 获取缓存数据
  getCachedData() {
    const cacheKey = `${this.data.insectId}_${this.data.openid}`;
    const cachedData = wx.getStorageSync(cacheKey);
    
    if (!cachedData && this.data.insectId !== this.data.id) {
      // 尝试用原始ID获取缓存
      const oldCacheKey = `${this.data.id}_${this.data.openid}`;
      return wx.getStorageSync(oldCacheKey);
    }
    
    return cachedData;
  },

  // 处理缓存命中情况
  handleCacheHit(cachedData) {
    this.setData({
      ...cachedData,
      cacheHit: true
    });
    this.logInsectDetail('缓存加载');
  },

  // 从云端获取数据
  async fetchDataFromCloud() {
    try {
      // 获取昆虫基本信息
      const insectDetail = await this.getInsectDetailFromCloud();
      
      // 获取用户昆虫记录
      const userRecord = await this.getUserInsectRecord();
      
      // 整合数据
      const mergedData = this.mergeInsectAndUserRecord(insectDetail, userRecord);
      
      // 更新页面数据
      this.setData(mergedData);
      
      // 缓存数据
      this.cacheInsectData(mergedData);
      
      // 记录日志
      this.logInsectDetail('云端加载');
      
    } catch (error) {
      throw new Error(`获取云端数据失败: ${error.message}`);
    }
  },

  // 从云端获取昆虫基本信息
  async getInsectDetailFromCloud() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('insects').doc(this.data.insectId).get();
      
      // 处理图片URL优先级
      const insectInfo = result.data;
      const imageUrl = this.data.imageUrl || insectInfo.imageUrl || this.getPresetImageUrl(this.data.normalizedName);
      
      // 验证图片URL
      const validImageUrl = await this.validateImageUrl(imageUrl);
      
      return {
        ...insectInfo,
        imageUrl: validImageUrl
      };
    } catch (error) {
      console.warn('获取昆虫基本信息失败，使用默认信息', error);
      return {
        imageUrl: this.getPresetImageUrl(this.data.normalizedName)
      };
    }
  },

  // 获取用户昆虫记录
  async getUserInsectRecord() {
    if (!this.data.openid) return null;
    
    try {
      const db = wx.cloud.database();
      const result = await db.collection('user_insects')
        .where({
          _openid: this.data.openid,
          insectId: this.data.insectId
        })
        .orderBy('lastFoundTime', 'desc')
        .get();
      
      return result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.warn('获取用户昆虫记录失败，尝试使用原始ID查询', error);
      
      // 尝试用原始ID查询
      try {
        const db = wx.cloud.database();
        const oldResult = await db.collection('user_insects')
          .where({
            _openid: this.data.openid,
            insectId: this.data.id
          })
          .orderBy('lastFoundTime', 'desc')
          .get();
        
        return oldResult.data && oldResult.data.length > 0 ? oldResult.data[0] : null;
      } catch (oldError) {
        console.warn('使用原始ID查询用户记录也失败', oldError);
        return null;
      }
    }
  },

  // 整合昆虫信息和用户记录
  mergeInsectAndUserRecord(insectDetail, userRecord) {
    const isNewDiscovery = !userRecord;
    const foundCount = isNewDiscovery ? 0 : userRecord.foundCount || 0;
    const lastFoundTime = userRecord?.lastFoundTime ? this.formatTimeToISO(userRecord.lastFoundTime) : '';
    const lastFoundDate = lastFoundTime ? this.formatDate(lastFoundTime) : '';
    const notesList = userRecord?.notesList || [];
    
    // 保存原始发现次数，用于编辑模式保护
    this.setData({ _originalFoundCount: foundCount });
    
    return {
      ...insectDetail,
      isNewDiscovery,
      foundCount,
      lastFoundTime,
      lastFoundDate,
      notesList,
      location: userRecord?.location || this.data.location
    };
  },

  // 补充昆虫数据（分类信息和百科内容）
  enrichInsectData() {
    // 获取分类信息
    this.fetchClassificationInfo();
    
    // 获取百科内容
    this.fetchBaiduBaikeContent();
  },

  // 获取分类信息
  fetchClassificationInfo() {
    const classificationMap = {
      '蝴蝶': { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '鳞翅目', family: '凤蝶科' },
      '蜜蜂': { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '膜翅目', family: '蜜蜂科' },
      '蜻蜓': { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '蜻蜓目', family: '差翅亚目' },
      '苍蝇': { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '双翅目', family: '蝇科' },
      '蚊子': { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '双翅目', family: '蚊科' },
      '蟑螂': { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '蜚蠊目', family: '蜚蠊科' }
    };
    
    const classificationInfo = classificationMap[this.data.normalizedName] || {};
    
    this.setData({ classificationInfo });
  },

  // 获取百科内容
  fetchBaiduBaikeContent() {
    const baikeContent = this.getMockBaikeContent(this.data.normalizedName);
    this.setData({ baikeContent });
  },

  // 获取预设图片URL
  getPresetImageUrl(name) {
    return this.presetImageUrls[name] || 'https://example.com/default_insect.jpg';
  },

  // 验证图片URL
  validateImageUrl(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(this.getPresetImageUrl(this.data.normalizedName));
        return;
      }
      
      // 创建图片对象进行验证
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => {
        console.warn(`图片加载失败: ${url}，尝试使用预设图片`);
        resolve(this.getPresetImageUrl(this.data.normalizedName));
      };
      img.src = url;
      
      // 设置超时
      setTimeout(() => {
        if (img.complete) return;
        console.warn(`图片加载超时: ${url}，尝试使用预设图片`);
        resolve(this.getPresetImageUrl(this.data.normalizedName));
      }, 3000);
    });
  },

  // 缓存昆虫数据
  cacheInsectData(data) {
    const cacheKey = `${this.data.insectId}_${this.data.openid}`;
    const cacheData = {
      id: this.data.id,
      name: this.data.name,
      normalizedName: this.data.normalizedName,
      insectId: this.data.insectId,
      imageUrl: data.imageUrl,
      location: data.location,
      foundCount: data.foundCount,
      lastFoundTime: data.lastFoundTime,
      lastFoundDate: data.lastFoundDate,
      notesList: data.notesList,
      baikeContent: this.data.baikeContent,
      classificationInfo: this.data.classificationInfo,
      cachedAt: new Date().toISOString()
    };
    
    wx.setStorageSync(cacheKey, cacheData);
    
    // 为了兼容性，也用原始ID保存一份
    if (this.data.insectId !== this.data.id) {
      const oldCacheKey = `${this.data.id}_${this.data.openid}`;
      wx.setStorageSync(oldCacheKey, cacheData);
    }
  },

  // 记录昆虫详情日志
  logInsectDetail(source) {
    const logData = {
      id: this.data.id,
      name: this.data.name,
      normalizedName: this.data.normalizedName,
      insectId: this.data.insectId,
      imageUrl: this.data.imageUrl,
      location: this.data.location,
      foundCount: this.data.foundCount,
      lastFoundTime: this.data.lastFoundTime,
      lastFoundDate: this.data.lastFoundDate,
      notesList: this.data.notesList,
      baikeContent: this.data.baikeContent,
      classificationInfo: this.data.classificationInfo,
      source: source,
      timestamp: new Date().toISOString()
    };
    
    console.log('昆虫详情日志:', JSON.stringify(logData));
  },

  // 获取模拟百科内容
  getMockBaikeContent(name) {
    const baikeMap = {
      '蝴蝶': '蝴蝶是昆虫纲鳞翅目动物的统称，世界上大约有14000多种蝴蝶，大部分分布在美洲，尤其在亚马逊河流域品种最多。中国有1200种。蝴蝶一般色彩鲜艳，身上有好多条纹，色彩较丰富，翅膀和身体有各种花斑。',
      '蜜蜂': '蜜蜂是膜翅目、蜜蜂科昆虫的统称。蜜蜂为社会性昆虫，由蜂王、雄蜂、工蜂等个体组成。蜜蜂种类很多，主要有小蜜蜂、黑小蜜蜂、大蜜蜂、黑大蜜蜂、沙巴蜂、苏威拉西蜂、绿奴蜂、西方蜜蜂与东方蜜蜂九大种类。',
      '蜻蜓': '蜻蜓是无脊椎动物，昆虫纲，蜻蜓目，差翅亚目昆虫的通称。后翅基部比前翅基部稍大，翅脉也稍有不同。休息时四翅展开，平放于两侧。稚虫短粗，具直肠鳃，无尾鳃。',
      '苍蝇': '苍蝇是完全变态的昆虫，它的生活史可分为卵、幼虫（3个龄期）、前蛹、蛹、成虫几个时期。苍蝇的寿命虽然只有1个月左右，但其繁殖力很强。苍蝇的食性非常复杂，属于杂食性蝇类，可以取食各种物质。',
      '蚊子': '蚊子是最重要的医学昆虫类群。蚊分布很广，种类很多，迄今为止全世界已记录蚊虫共3亚科（巨蚊亚科、按蚊亚科、库蚊亚科），35属，3600多种和亚种。中国已发现370余种，其中按蚊、库蚊、伊蚊3个属的蚊种超过半数。',
      '蟑螂': '蟑螂，泛指属于“蜚蠊目”（学名）的昆虫， 属于节肢动物门、昆虫纲、蜚蠊目，俗称蟑螂，是常见的医学昆虫。蟑螂体扁平，黑褐色，通常中等大小。头小，能活动。触角长丝状，复眼发达。',
      '蚂蚁': '蚂蚁是一种昆虫，别名蚁、玄驹、昆蜉、蚍蜉蚂，属节肢动物门，昆虫纲，膜翅目，蚁科。蚂蚁的种类繁多，世界上已知有11700多种，有21亚科283属，中国境内已确定的蚂蚁种类有600多种。',
      '蚂蚱': '蚂蚱，植食性昆虫，具咀嚼式口器。触角呈短鞭状，拥有强而有力的后腿，可利用弹跳来避开天敌。体色有绿色和褐色，是生活环境的保护色。蚂蚱口大、下巴发达，以植物叶片为食，全世界有超过12000种蚂蚱，分布于全世界的热带、温带的草地和沙漠地区。',
      '蝉': '蝉生活于世界温带至热带地区（已记录约 2000 余种蝉）。一些分布于沙漠地区的种类，当体温过热时，会从背板（tergum）排出多余的水分，进而达到冷却及散热的效果。',
      '甲虫': '甲虫是鞘翅目昆虫的统称，属有翅亚纲、全变态类。身体外部有硬壳，前翅是角质，厚而硬，后翅是膜质，如金龟子、天牛、象鼻虫等。多数种类属于世界性分布，本目中许多种类是农林作物重要害虫，与人类的经济利益关系十分密切。',
      '蜘蛛': '蜘蛛是陆地生态系统中最丰富的捕食性天敌，在维持农林生态系统稳定中的作用不容忽视。体长1～90毫米，身体分头胸部（前体）和腹部（后体）两部分，头胸部覆以背甲和胸板。',
      '蟋蟀': '蟋蟀无脊椎动物，昆虫纲，直翅目，蟋蟀总科。亦称促织，俗名蛐蛐、夜鸣虫（因为它在夜晚鸣叫）、将军虫、秋虫、斗鸡、促织、趋织、地喇叭、灶鸡子、孙旺，土蜇，“和尚”则是对蟋蟀生出双翅前的叫法。',
      '螳螂': '螳螂，亦称刀螂，无脊椎动物，属肉食性昆虫。在古希腊，人们将螳螂视为先知，因螳螂前臂举起的样子像祈祷的少女，所以又称祷告虫。除极地外，广布世界各地，尤以热带地区种类最为丰富。世界已知2000多种左右。',
      '萤火虫': '萤火虫俗称火金姑、亮火虫，是昆虫纲鞘翅目萤科中能够发光的昆虫的俗称，已知共有2000多种，分属于8个亚科92属和亚属，分布于温带、亚热带和热带地区。',
      '毛毛虫': '毛毛虫一般指鳞翅目（蛾类和蝶类）昆虫的幼虫。具3对胸足，腹足和尾足大多为5对，有的幼虫身上有很多有毒的刚毛，人碰到的话皮肤会红肿。',
      '虱子': '虱子的成虫和若虫终生在寄主体上吸血。寄主主要为：陆生哺乳类动物，少数为海栖哺乳类，人类也常被寄生。虱子不仅吸血危害，而且使寄主奇痒不安，并能传染很多重要的人畜疾病。',
      '跳蚤': '跳蚤属于蚤目的完全变态类。俗称革子，跳蚤是小型、无翅、善跳跃的寄生性昆虫，成虫通常生活在哺乳类动物身上，少数寄生在鸟类身上。触角粗短。口器锐利，用于吸吮。腹部宽大，有9节。后腿发达、粗壮。',
      '蚜虫': '蚜虫，又称腻虫、蜜虫，是一类植食性昆虫，包括蚜总科（又称蚜虫总科，学名：Aphidoidea）下的所有成员。目前已经发现的蚜虫总共有10个科约4400种，其中多数属于蚜科。',
      '飞蛾': '飞蛾类，昆虫纲鳞翅目昆虫，多在夜间活动，喜欢在光亮处聚集，因此民谚有“飞蛾扑火自烧身”的说法。植物提供多种蛾类幼时的食物来源，蛾类的幼虫及成虫也是鸟类、爬虫类、两栖类等食虫性动物的主要食物来源之一，形成自然界重要的食物链。',
      '竹节虫': '竹节虫，竹节鞭，属有翅亚纲下的直翅总目，因身体修长而得名，有翅或无翅。体长而大，为中型或大型昆虫，一般体长在6厘米至24厘米。最大的62.4厘米。',
      '椿象': '椿象，是六足亚门，昆虫纲，有翅亚纲，半翅目，蝽科动物，乃半翅目中种类最多的一群，全世界单椿象科种类约有5000种。椿象体长1.7～2.5公分。',
      '书虱': '书虱是指啮目 psocoptera 、虱啮科 liposcelididae 、虱啮属 liposcelis 一类昆虫的统称。在整个啮目昆虫中， 虱啮属是经济意义最重要的一个类群。'
    };
    
    return baikeMap[name] || `关于${name}的详细信息。`;
  },

  // 格式化时间为ISO格式
  formatTimeToISO(time) {
    if (!time) return '';
    
    if (time instanceof Date) {
      return time.toISOString();
    } else if (typeof time === 'object' && time._seconds) {
      // 处理Firebase Timestamp
      return new Date(time._seconds * 1000).toISOString();
    } else if (typeof time === 'string') {
      // 尝试直接转换字符串
      const date = new Date(time);
      return isNaN(date.getTime()) ? '' : date.toISOString();
    }
    
    return '';
  },

  // 格式化日期为YYYY-MM-DD
  formatDate(isoString) {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ 
      _isPullDownRefresh: true, 
      loading: true 
    });
    this.loadInsectDetail();
  },

  // 添加观察笔记
  addObservationNotes() {
    const { insectId, name, normalizedName, imageUrl, lastFoundDate } = this.data;
    
    wx.navigateTo({
      url: `/pages/edit-notes/edit-notes?insectId=${insectId}&name=${name}&normalizedName=${normalizedName}&imageUrl=${encodeURIComponent(imageUrl)}&lastFoundDate=${lastFoundDate}`
    });
  },

  // 更新观察笔记
  async updateObservationNotes(notes, isNewDiscovery = false) {
    try {
      this.setData({ loading: true });
      
      // 验证参数
      if (!notes || typeof notes !== 'string') {
        throw new Error('观察笔记不能为空');
      }
      
      // 获取位置信息
      const locationData = await this.getLocation();
      
      // 准备数据
      const updateData = {
        insectId: this.data.insectId,
        name: this.data.name,
        normalizedName: this.data.normalizedName,
        imageUrl: this.data.imageUrl,
        notes: notes,
        location: locationData,
        currentFoundCount: this.data.foundCount,
        isNewDiscovery: isNewDiscovery,
        shouldIncrementCount: isNewDiscovery,
        action: 'update'
      };
      
      // 调用云函数保存
      const result = await wx.cloud.callFunction({
        name: 'markFound',
        data: updateData
      });
      
      if (result.result && result.result.success) {
        // 解析返回结果
        const { foundCount, isNewRecord, totalFound, totalInsects } = result.result;
        const lastFoundTime = new Date().toISOString();
        const lastFoundDate = this.formatDate(lastFoundTime);
        
        // 更新本地数据
        const notesList = [...this.data.notesList, {
          id: `note_${Date.now()}`,
          content: notes,
          createTime: lastFoundTime,
          location: locationData
        }];
        
        // 对于编辑模式，严格保护发现次数
        const finalFoundCount = isNewDiscovery ? foundCount : this.data._originalFoundCount;
        
        this.setData({
          foundCount: finalFoundCount,
          lastFoundTime,
          lastFoundDate,
          notesList,
          isNewDiscovery: false,
          totalFound,
          totalInsects
        });
        
        // 重新缓存数据
        this.cacheInsectData(this.data);
        
        // 成功提示
        wx.showToast({ title: '保存成功', icon: 'success' });
        
        return { success: true };
      } else {
        throw new Error(result.result?.message || '保存失败');
      }
    } catch (error) {
      this.handleError(error, '保存观察笔记失败');
      return { success: false, error: error.message };
    } finally {
      this.setData({ loading: false });
    }
  },

  // 获取位置信息
  getLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        altitude: true,
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            address: '', // 可以添加逆地理编码获取地址
            accuracy: res.accuracy,
            altitude: res.altitude
          });
        },
        fail: (error) => {
          console.warn('获取位置失败，使用默认值', error);
          // 使用默认位置或之前保存的位置
          resolve(this.data.location || {
            latitude: 0,
            longitude: 0,
            address: '位置获取失败',
            accuracy: 0,
            altitude: 0
          });
        }
      });
    });
  },

  // 删除昆虫记录
  async deleteInsectRecord() {
    try {
      this.setData({ loading: true });
      
      // 调用云函数删除
      const result = await wx.cloud.callFunction({
        name: 'markFound',
        data: {
          insectId: this.data.insectId,
          action: 'delete'
        }
      });
      
      if (result.result && result.result.success) {
        // 重置本地数据
        this.setData({
          foundCount: 0,
          lastFoundTime: '',
          lastFoundDate: '',
          notesList: [],
          isNewDiscovery: true
        });
        
        // 清除缓存
        this.clearInsectCache();
        
        // 成功提示
        wx.showToast({ title: '删除成功', icon: 'success' });
        
        return { success: true };
      } else {
        throw new Error(result.result?.message || '删除失败');
      }
    } catch (error) {
      this.handleError(error, '删除昆虫记录失败');
      return { success: false, error: error.message };
    } finally {
      this.setData({ loading: false });
    }
  },

  // 清除昆虫缓存
  clearInsectCache() {
    const cacheKey = `${this.data.insectId}_${this.data.openid}`;
    wx.removeStorageSync(cacheKey);
    
    // 也清除原始ID的缓存
    if (this.data.insectId !== this.data.id) {
      const oldCacheKey = `${this.data.id}_${this.data.openid}`;
      wx.removeStorageSync(oldCacheKey);
    }
  },

  // 重新添加曾经记录的昆虫
  reAddInsectRecord() {
    // 简单地将isNewDiscovery设置为true即可
    this.setData({ isNewDiscovery: true });
    // 提示用户可以重新添加
    wx.showToast({ title: '现在可以重新添加此昆虫', icon: 'none' });
  },

  // 处理图片加载错误
  onImageError(e) {
    console.warn('图片加载错误:', e);
    this.tryToReloadImage();
  },

  // 尝试重新加载图片
  async tryToReloadImage() {
    try {
      // 首先尝试使用预设图片
      const presetImage = this.getPresetImageUrl(this.data.normalizedName);
      if (presetImage !== this.data.imageUrl) {
        this.setData({ imageUrl: presetImage });
        return;
      }
      
      // 如果预设图片也失败，尝试从数据库获取
      const imageFromDb = await this.fetchImageFromDatabase();
      if (imageFromDb) {
        this.setData({ imageUrl: imageFromDb });
      }
    } catch (error) {
      console.warn('重新加载图片失败:', error);
      // 使用默认图片
      this.setData({ imageUrl: 'https://example.com/default_insect.jpg' });
    }
  },

  // 从数据库获取图片
  async fetchImageFromDatabase() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('insects').doc(this.data.insectId).get();
      return result.data?.imageUrl || null;
    } catch (error) {
      console.warn('从数据库获取图片失败:', error);
      return null;
    }
  },

  // 处理错误
  handleError(error, userMessage) {
    console.error(userMessage, error);
    this.setData({
      error: userMessage,
      loading: false
    });
    
    wx.showToast({
      title: userMessage,
      icon: 'error',
      duration: 2000
    });
  },

  // 返回按钮点击事件
  onBackTap() {
    // 刷新上一页数据
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      if (prevPage && typeof prevPage.refreshData === 'function') {
        prevPage.refreshData();
      }
    }
    
    wx.navigateBack();
  },

  // 分享功能
  onShareAppMessage() {
    const { name, insectId } = this.data;
    return {
      title: `${name} - 昆虫观察记录`,
      path: `/pages/insect-detail/insect-detail?id=${insectId}&name=${name}`,
      imageUrl: this.data.imageUrl
    };
  }
});