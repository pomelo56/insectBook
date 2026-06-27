// 简单的本地测试脚本
const cloudFunction = require('./index');

// 模拟云函数调用
const testEvent = {
  insectName: '豆娘',
  retryAttempt: 1,
  timestamp: Date.now(),
  forceRefresh: false
};

// 执行云函数
async function testCloudFunction() {
  console.log('开始测试云函数，昆虫名称: 豆娘');
  try {
    // 模拟context对象（简单版本）
    const mockContext = {
      OPENID: 'test_openid',
      APPID: 'test_appid',
      UNIONID: 'test_unionid'
    };
    
    // 调用云函数主函数
    const result = await cloudFunction.main(testEvent, mockContext);
    
    console.log('\n测试结果:');
    console.log('成功状态:', result.success);
    console.log('数据源:', result.source);
    console.log('描述内容:', result.description ? result.description.substring(0, 150) + '...' : '无');
    console.log('\n调试日志:');
    if (result.debugLogs && result.debugLogs.length > 0) {
      result.debugLogs.forEach(log => console.log(log));
    }
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testCloudFunction();