// 获取用户列表云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 参数解析
    const { pageNum = 1, pageSize = 20, searchKey = '', filter = 'all', sortBy = 'registerTime', sortOrder = 'desc' } = event;
    
    // 构建查询条件
    const query = {};
    
    // 搜索条件
    if (searchKey) {
      query.nickName = db.RegExp({
        regexp: searchKey,
        options: 'i',
      });
    }
    
    // 过滤条件
    if (filter === 'active') {
      // 活跃用户：最近7天有登录记录
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.lastLoginTime = _.gte(sevenDaysAgo);
    } else if (filter === 'new') {
      // 新用户：最近30天注册
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createTime = _.gte(thirtyDaysAgo);
    }
    
    // 构建排序条件
    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // 执行数据库查询
    const result = await db.collection('users')
      .where(query)
      .orderBy(sortBy, sortOrder)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 格式化返回数据
    const users = result.data.map(user => {
      return {
        openid: user._openid || user.openid,
        nickName: user.nickName || '未知用户',
        avatarUrl: user.avatarUrl || '',
        collectedCount: user.collectedCount || 0,
        level: user.level || 1,
        registerTime: user.createTime ? formatDate(user.createTime) : '未知',
        lastLoginTime: user.lastLoginTime ? formatDate(user.lastLoginTime) : '未知'
      };
    });
    
    return {
      success: true,
      users: users,
      total: result.data.length,
      pageNum: pageNum,
      pageSize: pageSize
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      error: error.message,
      users: []
    };
  }
};

// 格式化日期函数
function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}