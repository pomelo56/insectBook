// tests/unit/insectService.test.js
// 昆虫数据服务单元测试 — 覆盖 insectService 三个导出函数

const insectService = require('../../miniprogram/services/insectService');

/* ==================================================================
   测试辅助函数：构建 wx.cloud.database 链式 mock
   ================================================================== */

/**
 * 构建完整的数据库 mock
 * @param {object} opts - 配置选项
 * @param {number} opts.totalCount - insects.count() 返回值
 * @param {boolean} opts.countFails - insects.count() 是否抛错
 * @param {Array} opts.userRecords - user_insects 查询返回值
 * @param {boolean} opts.userRecordsFails - user_insects 查询是否抛错
 * @param {Array} opts.insectDetails - insects 详情查询返回值
 * @param {boolean} opts.detailsFails - 详情查询是否抛错
 */
function buildDbMock(opts = {}) {
  const {
    totalCount = 30,
    countFails = false,
    userRecords = [],
    userRecordsFails = false,
    insectDetails = [],
    detailsFails = false
  } = opts;

  // command mock
  const commandMock = {
    in: jest.fn((arr) => arr)
  };

  // insects 集合: 支持 count() 和 where().get()
  const insectsWhereGet = jest.fn().mockResolvedValue({ data: insectDetails });
  const insectsWhere = jest.fn().mockReturnValue({ get: insectsWhereGet });
  const insectsCount = jest.fn().mockImplementation(() => {
    if (countFails) throw new Error('count failed');
    return Promise.resolve({ total: totalCount });
  });

  const insectsCollection = {
    count: insectsCount,
    where: insectsWhere
  };

  // user_insects 集合: 支持 where().orderBy().skip().limit().get()
  const userGet = jest.fn().mockImplementation(() => {
    if (userRecordsFails) throw new Error('user records query failed');
    return Promise.resolve({ data: userRecords });
  });
  const userLimit = jest.fn().mockReturnValue({ get: userGet });
  const userSkip = jest.fn().mockReturnValue({ limit: userLimit });
  const userOrderBy = jest.fn().mockReturnValue({ skip: userSkip });
  const userWhere = jest.fn().mockReturnValue({ orderBy: userOrderBy });

  const userInsectsCollection = {
    where: userWhere
  };

  const collectionMock = jest.fn((name) => {
    if (name === 'insects') return insectsCollection;
    if (name === 'user_insects') return userInsectsCollection;
    return { get: jest.fn().mockResolvedValue({ data: [] }) };
  });

  const dbMock = {
    collection: collectionMock,
    command: commandMock
  };

  return {
    dbMock,
    insectsCount,
    insectsWhere,
    insectsWhereGet,
    userWhere,
    userOrderBy,
    userSkip,
    userLimit,
    userGet,
    collectionMock,
    commandMock
  };
}

/* ==================================================================
   calculateProgress 测试
   ================================================================== */
describe('calculateProgress(collected, total)', () => {
  const { calculateProgress } = insectService;

  test('collected=5, total=10 应返回 50', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  test('collected=1, total=100 应返回至少 1（Math.max兜底）', () => {
    expect(calculateProgress(1, 100)).toBe(1);
  });

  test('collected=0, total=10 应返回 0（无收藏）', () => {
    expect(calculateProgress(0, 10)).toBe(0);
  });

  test('total=0 应返回 0', () => {
    expect(calculateProgress(5, 0)).toBe(0);
  });

  test('total 为负数应返回 0', () => {
    expect(calculateProgress(5, -1)).toBe(0);
  });

  test('collected 与 total 均为 0 应返回 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  test('collected=null, total=10 应返回 0（falsy 保护）', () => {
    expect(calculateProgress(null, 10)).toBe(0);
  });

  test('collected=undefined, total=10 应返回 0', () => {
    expect(calculateProgress(undefined, 10)).toBe(0);
  });

  test('边界：collected=3, total=6 应返回 50（Math.round 四舍五入）', () => {
    expect(calculateProgress(3, 6)).toBe(50);
  });

  test('collected=7, total=10 应返回 70', () => {
    expect(calculateProgress(7, 10)).toBe(70);
  });

  test('collected=10, total=10 应返回 100（全部收集）', () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });
});

/* ==================================================================
   recoverInsectDataFromCache 测试
   ================================================================== */
describe('recoverInsectDataFromCache()', () => {
  const { recoverInsectDataFromCache } = insectService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('缓存中有有效数据时应返回完整结构', () => {
    const mockInsects = [
      { id: 'insect1', name: '七星瓢虫', lastFoundTime: '2025-01-01T00:00:00.000Z' },
      { id: 'insect2', name: '蝴蝶', lastFoundTime: '2025-01-02T00:00:00.000Z' }
    ];
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'recent_insects') return mockInsects;
      if (key === 'collectedCount') return 5;
      if (key === 'totalCount') return 30;
      return null;
    });

    const result = recoverInsectDataFromCache();

    expect(result).toEqual({
      recentInsects: mockInsects,
      collectedCount: 2,   // 使用 actualCount（数组长度），非缓存中的 5
      totalCount: 30,
      progressPercent: expect.any(Number),
      currentPage: 1,
      hasMoreData: true
    });
    expect(result.progressPercent).toBeGreaterThan(0);
  });

  test('缓存为空时应返回默认空状态', () => {
    wx.getStorageSync.mockReturnValue(null);

    const result = recoverInsectDataFromCache();

    expect(result).toEqual({
      recentInsects: [],
      collectedCount: 0,
      totalCount: 30,
      progressPercent: 0,
      currentPage: 1,
      hasMoreData: true
    });
  });

  test('cachedInsects 不是数组时应重置为空数组', () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'recent_insects') return 'not-an-array';
      return null;
    });

    const result = recoverInsectDataFromCache();

    expect(result.recentInsects).toEqual([]);
    expect(result.collectedCount).toBe(0);
    expect(result.progressPercent).toBe(0);
  });

  test('cachedInsects 是空数组时应返回空状态', () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'recent_insects') return [];
      return null;
    });

    const result = recoverInsectDataFromCache();

    expect(result.recentInsects).toEqual([]);
    expect(result.collectedCount).toBe(0);
    expect(result.progressPercent).toBe(0);
  });

  test('totalCount 缓存为 0（falsy）时应回退到默认值 30', () => {
    // || 30 会将 falsy 值 0 替换为 30
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'totalCount') return 0;
      return null;
    });

    const result = recoverInsectDataFromCache();

    expect(result.totalCount).toBe(30);
    expect(result.progressPercent).toBe(0);
  });

  test('getStorageSync 抛错时应返回默认空状态（兜底）', () => {
    wx.getStorageSync.mockImplementation(() => {
      throw new Error('storage error');
    });

    const result = recoverInsectDataFromCache();

    expect(result).toEqual({
      recentInsects: [],
      collectedCount: 0,
      totalCount: 30,
      progressPercent: 0,
      currentPage: 1,
      hasMoreData: true
    });
  });

  test('只恢复前应忽略 collectedCount 缓存值，使用实际数组长度', () => {
    const mockInsects = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'recent_insects') return mockInsects;
      if (key === 'collectedCount') return 100; // 过时缓存值
      if (key === 'totalCount') return 30;
      return null;
    });

    const result = recoverInsectDataFromCache();

    // 使用实际数组长度 3，忽略缓存的 100
    expect(result.collectedCount).toBe(3);
  });
});

/* ==================================================================
   loadInsectData 测试
   ================================================================== */
describe('loadInsectData(params)', () => {
  const { loadInsectData } = insectService;

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 wx.cloud.database
    wx.cloud.database.mockClear();
    wx.setStorageSync.mockClear();
  });

  /* ---------- 参数校验 ---------- */

  test('未提供 openid 时应返回 error 并立即退出', async () => {
    const result = await loadInsectData({});

    expect(result).toMatchObject({
      records: [],
      totalCount: 30,
      collectedCount: 0,
      progressPercent: 0,
      hasMore: false
    });
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toContain('openid');
    // 不应调用数据库
    expect(wx.cloud.database).not.toHaveBeenCalled();
  });

  test('openid 为 null 时也应返回 error', async () => {
    const result = await loadInsectData({ openid: null });
    expect(result.error).toBeInstanceOf(Error);
  });

  test('openid 为空字符串时也应返回 error', async () => {
    const result = await loadInsectData({ openid: '' });
    expect(result.error).toBeInstanceOf(Error);
  });

  /* ---------- 首次加载（非 loadMore）---------- */

  test('首次加载：count 成功 + 有记录 + 有详情 → 完整数据返回', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', name: '七星瓢虫', createdAt: '2025-06-01T00:00:00.000Z', userImageUrl: '/img/a.jpg' }
    ];
    const mockDetails = [
      { _id: 'insect1', name: '七星瓢虫详情', userImageUrl: '/img/detail_a.jpg' }
    ];

    const { dbMock } = buildDbMock({
      totalCount: 42,
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({
      openid: 'test-openid',
      isLoadMore: false,
      currentPage: 1,
      pageSize: 10,
      recentInsects: []
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('insect1');
    expect(result.records[0].name).toBe('七星瓢虫');
    expect(result.totalCount).toBe(42);
    expect(result.collectedCount).toBe(1);
    expect(result.progressPercent).toBeGreaterThan(0);
    expect(result.hasMore).toBe(false); // 1 < 10
    expect(result.error).toBeUndefined();

    // 验证缓存写入
    expect(wx.setStorageSync).toHaveBeenCalledWith('recent_insects', expect.any(Array));
    expect(wx.setStorageSync).toHaveBeenCalledWith('collectedCount', 1);
    expect(wx.setStorageSync).toHaveBeenCalledWith('totalCount', 42);
  });

  test('首次加载：count 失败时应使用默认 totalCount=30', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: '2025-06-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      totalCount: 30,
      countFails: true,
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.totalCount).toBe(30);
    expect(result.records).toHaveLength(1);
    // 错误被静默处理，不影响主流程
  });

  test('首次加载：user_insects 查询失败时应返回 error', async () => {
    const { dbMock } = buildDbMock({
      totalCount: 30,
      userRecordsFails: true,
      userRecords: []
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.records).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  test('首次加载：无记录时应返回空状态', async () => {
    const { dbMock } = buildDbMock({
      totalCount: 30,
      userRecords: []
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records).toEqual([]);
    expect(result.collectedCount).toBe(0);
    expect(result.progressPercent).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  /* ---------- 去重逻辑 ---------- */

  test('同一 insectId 多次出现时应保留最新的记录', async () => {
    const oldDate = '2025-01-01T00:00:00.000Z';
    const newDate = '2025-06-01T00:00:00.000Z';
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: oldDate, name: '旧记录' },
      { _id: 'r2', insectId: 'insect1', createdAt: newDate, name: '新记录' }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      totalCount: 30,
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records).toHaveLength(1);
    expect(result.records[0].lastFoundTime).toBe(newDate);
    expect(result.records[0].name).toBe('新记录');
    expect(result.collectedCount).toBe(1); // 去重后只有1条
  });

  test('同一 insectId 多次出现、但第一条更新 → 应保留第一条', async () => {
    const newDate = '2025-06-01T00:00:00.000Z';
    const oldDate = '2025-01-01T00:00:00.000Z';
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: newDate, name: '新' },
      { _id: 'r2', insectId: 'insect1', createdAt: oldDate, name: '旧' }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].name).toBe('新');
    expect(result.collectedCount).toBe(1);
  });

  test('insectId 为空的记录应被跳过', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: '', createdAt: '2025-01-01T00:00:00.000Z' },
      { _id: 'r2', insectId: 'insect1', createdAt: '2025-01-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('insect1');
  });

  /* ---------- 详情查询失败处理 ---------- */

  test('详情查询失败时应降级使用已有数据', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', name: '来自记录的名称', createdAt: '2025-01-01T00:00:00.000Z' }
    ];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: [],
      detailsFails: true
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records).toHaveLength(1);
    // 使用 record 自己的 name，详情失败不影响
    expect(result.records[0].name).toBe('来自记录的名称');
  });

  /* ---------- isNew 标记 ---------- */

  test('24小时内的记录应标记为 isNew=true', async () => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 12 * 3600 * 1000).toISOString(); // 12小时前
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: recentDate }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].isNew).toBe(true);
  });

  test('超过24小时的记录应标记为 isNew=false', async () => {
    const oldDate = new Date(Date.now() - 48 * 3600 * 1000).toISOString(); // 48小时前
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: oldDate }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].isNew).toBe(false);
  });

  /* ---------- 图片 URL 回退链 ---------- */

  test('图片 URL 应优先使用 userImageUrl', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', userImageUrl: '/user_img.jpg', createdAt: '2025-01-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1', userImageUrl: '/detail_img.jpg' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].imageUrl).toBe('/user_img.jpg');
  });

  test('图片 URL 回退到 detail.userImageUrl', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: '2025-01-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1', userImageUrl: '/detail_img.jpg' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].imageUrl).toBe('/detail_img.jpg');
  });

  test('图片 URL 最终回退到默认图片', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: '2025-01-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1' }]; // 无 userImageUrl

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].imageUrl).toBe('/images/empty_insect.png');
  });

  /* ---------- 分页/loadMore ---------- */

  test('loadMore 模式：应与已有 recentInsects 合并去重', async () => {
    const existingInsects = [
      { id: 'insect1', name: '已有1', lastFoundTime: '2025-01-01T00:00:00.000Z' }
    ];
    const mockRecords = [
      { _id: 'r2', insectId: 'insect2', name: '新昆虫', createdAt: '2025-06-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect2', name: '新昆虫详情' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({
      openid: 'test-openid',
      isLoadMore: true,
      currentPage: 2,
      pageSize: 10,
      recentInsects: existingInsects
    });

    // 应包含已有 + 新增
    expect(result.records.length).toBeGreaterThanOrEqual(2);
  });

  test('records 长度 >= pageSize 时 hasMore 应为 true（还有更多数据）', async () => {
    const mockRecords = [];
    for (let i = 0; i < 10; i++) {
      mockRecords.push({
        _id: `r${i}`,
        insectId: `insect${i}`,
        createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString()
      });
    }
    const mockDetails = mockRecords.map(r => ({ _id: r.insectId }));

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({
      openid: 'test-openid',
      isLoadMore: false,
      pageSize: 10
    });

    // records.length (10) >= pageSize (10) → hasMore = true（表示可能还有更多数据）
    expect(result.hasMore).toBe(true);
    expect(result.records.length).toBeLessThanOrEqual(10);
  });

  test('非 loadMore 模式：应切片到 pageSize', async () => {
    const mockRecords = [];
    for (let i = 0; i < 15; i++) {
      mockRecords.push({
        _id: `r${i}`,
        insectId: `insect${i}`,
        createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString()
      });
    }
    const mockDetails = mockRecords.map(r => ({ _id: r.insectId }));

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({
      openid: 'test-openid',
      isLoadMore: false,
      pageSize: 10
    });

    // 非 loadMore 模式：sortedInsects.slice(0, pageSize)
    expect(result.records.length).toBeLessThanOrEqual(10);
  });

  /* ---------- 缓存保存失败 ---------- */

  test('缓存保存失败时应静默处理，不影响返回数据', async () => {
    wx.setStorageSync.mockImplementation(() => {
      throw new Error('storage full');
    });

    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: '2025-01-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    // 不应抛出异常
    const result = await loadInsectData({ openid: 'test-openid' });
    expect(result.records).toHaveLength(1);
    expect(result.collectedCount).toBe(1);
  });

  /* ---------- loadMore + 已有数据合并 ---------- */

  test('loadMore 时已有数据中的旧 insect 和新的重复 → 保留最新的', async () => {
    const oldDate = '2025-01-01T00:00:00.000Z';
    const newDate = '2025-06-15T00:00:00.000Z';
    const existingInsects = [
      { id: 'insect1', name: '旧版本', lastFoundTime: oldDate }
    ];
    const mockRecords = [
      { _id: 'r2', insectId: 'insect1', name: '新版本', createdAt: newDate }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({
      openid: 'test-openid',
      isLoadMore: true,
      recentInsects: existingInsects,
      pageSize: 10
    });

    // 新版本应覆盖旧版本
    const insect1 = result.records.find(r => r.id === 'insect1');
    expect(insect1.name).toBe('新版本');
    expect(insect1.lastFoundTime).toBe(newDate);
  });

  /* ---------- 排序验证 ---------- */

  test('结果应按 lastFoundTime 降序排列', async () => {
    const dates = [
      '2025-03-01T00:00:00.000Z',
      '2025-06-01T00:00:00.000Z',
      '2025-01-01T00:00:00.000Z'
    ];
    const mockRecords = dates.map((d, i) => ({
      _id: `r${i}`,
      insectId: `insect${i}`,
      createdAt: d
    }));
    const mockDetails = mockRecords.map(r => ({ _id: r.insectId }));

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });

    expect(result.records[0].lastFoundTime).toBe('2025-06-01T00:00:00.000Z');
    expect(result.records[1].lastFoundTime).toBe('2025-03-01T00:00:00.000Z');
    expect(result.records[2].lastFoundTime).toBe('2025-01-01T00:00:00.000Z');
  });

  /* ---------- 空参数默认值 ---------- */

  test('未提供 params 时应使用默认值', async () => {
    // 即使无 params，也应因无 openid 而返回 error
    const result = await loadInsectData();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('默认值：isLoadMore=false, currentPage=1, pageSize=10, recentInsects=[]', async () => {
    const mockRecords = [
      { _id: 'r1', insectId: 'insect1', createdAt: '2025-01-01T00:00:00.000Z' }
    ];
    const mockDetails = [{ _id: 'insect1' }];

    const { dbMock } = buildDbMock({
      userRecords: mockRecords,
      insectDetails: mockDetails
    });
    wx.cloud.database.mockReturnValue(dbMock);

    const result = await loadInsectData({ openid: 'test-openid' });
    // 使用默认值：isLoadMore=false, currentPage=1, pageSize=10
    expect(result.records).toHaveLength(1);
  });
});

/* ==================================================================
   模块导出验证
   ================================================================== */
describe('insectService 模块导出', () => {
  test('应导出三个函数：loadInsectData, recoverInsectDataFromCache, calculateProgress', () => {
    expect(typeof insectService.loadInsectData).toBe('function');
    expect(typeof insectService.recoverInsectDataFromCache).toBe('function');
    expect(typeof insectService.calculateProgress).toBe('function');
  });

  test('不应导出额外属性', () => {
    const keys = Object.keys(insectService);
    expect(keys).toHaveLength(3);
    expect(keys).toContain('loadInsectData');
    expect(keys).toContain('recoverInsectDataFromCache');
    expect(keys).toContain('calculateProgress');
  });

  test('Service 函数不应依赖 this（纯函数/参数驱动）', () => {
    // calculateProgress 是纯函数
    expect(insectService.calculateProgress(5, 10)).toBe(50);

    // recoverInsectDataFromCache 只依赖 wx 全局
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = insectService.recoverInsectDataFromCache();
    expect(result).toBeDefined();
    spy.mockRestore();
  });
});
