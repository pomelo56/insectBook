// services/insectService.js
// 昆虫数据服务 — 纯数据逻辑层，不操作 Page.setData，不依赖 this
// 通过参数接收依赖，通过返回值输出数据

// 计算进度百分比：collected > 0 && total > 0 时返回 1-100，否则返回 0
function calculateProgress(collected, total) {
  return collected && total > 0 ? Math.max(1, Math.round((collected / total) * 100)) : 0;
}

// 从缓存恢复昆虫数据，只负责读取和校验，不操作 UI，始终返回有效结构
function recoverInsectDataFromCache() {
  try {
    let cachedInsects = wx.getStorageSync('recent_insects') || [];
    let cachedCount = wx.getStorageSync('collectedCount') || 0;
    let cachedTotal = wx.getStorageSync('totalCount') || 30;

    if (!Array.isArray(cachedInsects)) {
      cachedInsects = [];
    }

    const actualCount = cachedInsects.length;

    if (actualCount > 0) {
      return {
        recentInsects: cachedInsects,
        collectedCount: actualCount,
        totalCount: cachedTotal,
        progressPercent: calculateProgress(actualCount, cachedTotal),
        currentPage: 1,
        hasMoreData: true
      };
    }

    return {
      recentInsects: [],
      collectedCount: 0,
      totalCount: 30,
      progressPercent: 0,
      currentPage: 1,
      hasMoreData: true
    };
  } catch (error) {
    console.error('缓存恢复严重错误，返回空状态:', error);
    return {
      recentInsects: [],
      collectedCount: 0,
      totalCount: 30,
      progressPercent: 0,
      currentPage: 1,
      hasMoreData: true
    };
  }
}

// 加载昆虫数据：获取总数 → 查询用户记录 → 批量获取详情 → 去重 → 排序 → 缓存
// 参数: { openid, isLoadMore, currentPage, pageSize, recentInsects }
// 返回: { records, totalCount, collectedCount, progressPercent, hasMore, error }
async function loadInsectData(params = {}) {
  const { openid, isLoadMore = false, currentPage = 1, pageSize = 10, recentInsects = [] } = params;

  if (!openid) {
    return { records: [], totalCount: 30, collectedCount: 0, progressPercent: 0, hasMore: false, error: new Error('openid 未提供') };
  }

  const db = wx.cloud.database();
  const _ = db.command;

  // 1. 获取昆虫总数
  let totalCount = 30;
  try {
    const totalRes = await db.collection('insects').count();
    totalCount = totalRes.total || 30;
  } catch (e) {
    console.error('获取昆虫总数失败，使用默认值:', e);
  }

  // 2. 查询用户昆虫记录
  let records = [];
  try {
    const skipCount = isLoadMore ? (currentPage - 1) * pageSize : 0;
    const recentRes = await db.collection('user_insects')
      .where({ _openid: openid })
      .orderBy('createdAt', 'desc')
      .skip(skipCount)
      .limit(pageSize)
      .get();
    records = recentRes.data || [];
  } catch (e) {
    console.error('获取用户昆虫记录失败:', e);
    return { records: [], totalCount, collectedCount: 0, progressPercent: 0, hasMore: false, error: e };
  }

  const hasMore = records.length >= pageSize;

  // 无数据时返回空状态
  if (records.length === 0) {
    return {
      records: isLoadMore ? recentInsects : [],
      totalCount,
      collectedCount: isLoadMore ? recentInsects.length : 0,
      progressPercent: 0,
      hasMore: false
    };
  }

  // 3. 提取昆虫 ID 并去重
  const insectIds = [...new Set(records.map(r => r.insectId).filter(id => id))];

  // 4. 批量获取昆虫详情
  const insectDetails = {};
  if (insectIds.length > 0) {
    try {
      const detailRes = await db.collection('insects')
        .where({ _id: _.in(insectIds) })
        .get();
      detailRes.data.forEach(insect => { insectDetails[insect._id] = insect; });
    } catch (e) {
      console.error('获取昆虫详情失败:', e);
    }
  }

  // 5. 处理数据：构建对象、去重、排序
  const insectMap = new Map();

  if (isLoadMore && recentInsects.length > 0) {
    recentInsects.forEach(insect => { insectMap.set(insect.id, insect); });
  }

  records.forEach(item => {
    const insectId = item.insectId;
    if (!insectId) return;

    const detail = insectDetails[insectId] || {};
    const createdAt = item.createdAt || new Date().toISOString();
    const isNew = Date.now() - new Date(createdAt).getTime() < 24 * 3600 * 1000;
    const name = item.name || detail.name || '未知昆虫';

    const insectData = {
      id: insectId, name,
      foundCount: item.foundCount || 1,
      imageUrl: item.userImageUrl || detail.userImageUrl || '/images/empty_insect.png',
      userImageUrl: item.userImageUrl || detail.userImageUrl || '',
      lastFoundTime: createdAt, isNew,
      _id: item._id
    };

    if (!insectMap.has(insectId) ||
        new Date(createdAt).getTime() > new Date(insectMap.get(insectId).lastFoundTime).getTime()) {
      insectMap.set(insectId, insectData);
    }
  });

  const sortedInsects = Array.from(insectMap.values()).sort(
    (a, b) => new Date(b.lastFoundTime).getTime() - new Date(a.lastFoundTime).getTime()
  );

  const displayInsects = isLoadMore ? sortedInsects : sortedInsects.slice(0, pageSize);
  const collectedCount = sortedInsects.length;
  const progressPercent = calculateProgress(collectedCount, totalCount);

  // 6. 保存到缓存
  try {
    wx.setStorageSync('recent_insects', sortedInsects);
    wx.setStorageSync('collectedCount', collectedCount);
    wx.setStorageSync('totalCount', totalCount);
  } catch (e) {
    console.error('缓存保存失败:', e);
  }

  return { records: displayInsects, totalCount, collectedCount, progressPercent, hasMore };
}

module.exports = { loadInsectData, recoverInsectDataFromCache, calculateProgress };
