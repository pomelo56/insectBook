// 获取昆虫列表云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 参数解析
    const { pageNum = 1, pageSize = 20, searchKey = '', filter = 'all', sortBy = 'createTime', sortOrder = 'desc' } = event;
    
    // 构建查询条件
    const query = {};
    
    // 搜索条件
    if (searchKey) {
      query.$or = [
        { name: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { category: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { scientificName: db.RegExp({ regexp: searchKey, options: 'i' }) }
      ];
    }
    
    // 过滤条件
    if (filter === 'noImage') {
      query.imageUrl = _.eq('') || _.exists(false);
    } else if (filter === 'hasImage') {
      query.imageUrl = _.neq('').and(_.exists(true));
    }
    
    // 构建排序条件
    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // 执行数据库查询
    const result = await db.collection('insects')
      .where(query)
      .orderBy(sortBy, sortOrder)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取符合条件的总数据量
    const countResult = await db.collection('insects')
      .where(query)
      .count();
    const totalCount = countResult.total;
    
    // 格式化返回数据
    const insects = result.data.map(insect => {
      return {
        id: insect._id,
        externalId: insect.externalId || '',
        name: insect.name || '未知昆虫',
        category: insect.category || '未知分类',
        scientificName: insect.scientificName || '',
        imageUrl: insect.imageUrl || '',
        recognizeCount: insect.recognizeCount || 0,
        createTime: insect.createTime ? formatDate(insect.createTime) : '未知',
        description: insect.description || ''
      };
    });
    
    return {
      success: true,
      insects: insects,
      total: totalCount,
      pageNum: pageNum,
      pageSize: pageSize,
      hasMore: (pageNum - 1) * pageSize + result.data.length < totalCount
    };
  } catch (error) {
    console.error('获取昆虫列表失败:', error);
    return {
      success: false,
      error: error.message,
      insects: []
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