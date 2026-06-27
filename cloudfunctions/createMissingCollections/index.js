// 创建缺失的数据库集合
// 云函数：createMissingCollections
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const collectionsToCreate = ['admin_operations', 'admin_logs', 'user_stats'];
    const results = [];

    for (const collectionName of collectionsToCreate) {
      try {
        // 尝试获取集合的文档数量来检查是否存在
        const countResult = await db.collection(collectionName).count();
        results.push({
          collection: collectionName,
          status: 'exists',
          message: `集合已存在，包含 ${countResult.total} 条记录`
        });
      } catch (error) {
        // 如果集合不存在，会抛出错误，我们捕获并创建它
        if (error.code === 'COLLECTION_NOT_EXIST') {
          // 创建集合（通过添加一个临时文档）
          await db.collection(collectionName).add({
            data: {
              _temp: true,
              createTime: db.serverDate()
            }
          });
          
          // 删除临时文档
          const tempDocs = await db.collection(collectionName).where({ _temp: true }).get();
          if (tempDocs.data && tempDocs.data.length > 0) {
            for (const doc of tempDocs.data) {
              await db.collection(collectionName).doc(doc._id).remove();
            }
          }
          
          results.push({
            collection: collectionName,
            status: 'created',
            message: `集合创建成功`
          });
        } else {
          results.push({
            collection: collectionName,
            status: 'error',
            message: `检查集合时出错: ${error.message}`
          });
        }
      }
    }

    return {
      success: true,
      message: '集合检查和创建完成',
      results: results
    };
  } catch (error) {
    console.error('创建集合失败:', error);
    return {
      success: false,
      message: '操作失败',
      error: error.message
    };
  }
};