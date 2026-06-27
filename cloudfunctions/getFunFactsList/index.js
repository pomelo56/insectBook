// 获取冷知识列表云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 参数解析
    const { pageNum = 1, pageSize = 20, searchKey = '' } = event;
    
    // 构建查询条件
    const query = {};
    
    // 搜索条件
    if (searchKey) {
      query.$or = [
        { content: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { insectName: db.RegExp({ regexp: searchKey, options: 'i' }) }
      ];
    }
    
    // 执行数据库查询
    const result = await db.collection('fun_facts')
      .where(query)
      .orderBy('displayOrder', 'asc')
      .orderBy('updateTime', 'desc')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 格式化返回数据
    const funFacts = result.data.map(fact => {
      return {
        id: fact._id,
        content: fact.content || '',
        insectName: fact.insectName || '',
        displayOrder: fact.displayOrder || 0,
        createTime: fact.createTime ? formatDate(fact.createTime) : '未知',
        updateTime: fact.updateTime ? formatDate(fact.updateTime) : '未知'
      };
    });
    
    return {
      success: true,
      funFacts: funFacts,
      total: result.data.length,
      pageNum: pageNum,
      pageSize: pageSize
    };
  } catch (error) {
    console.error('获取冷知识列表失败:', error);
    return {
      success: false,
      error: error.message,
      funFacts: []
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