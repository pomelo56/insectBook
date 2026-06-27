// 获取勋章列表云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 查询所有勋章，按所需昆虫数量排序
    const result = await db.collection('badges')
      .orderBy('requiredCount', 'asc')
      .get();
    
    // 格式化返回数据
    const badges = result.data.map(badge => {
      return {
        id: badge._id,
        name: badge.name || '未命名勋章',
        level: badge.level || '',
        requiredCount: badge.requiredCount || 0,
        icon: badge.icon || '',
        description: badge.description || '',
        createTime: badge.createTime ? formatDate(badge.createTime) : '未知',
        updateTime: badge.updateTime ? formatDate(badge.updateTime) : '未知'
      };
    });
    
    return {
      success: true,
      badges: badges,
      total: badges.length
    };
  } catch (error) {
    console.error('获取勋章列表失败:', error);
    return {
      success: false,
      error: error.message,
      badges: []
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