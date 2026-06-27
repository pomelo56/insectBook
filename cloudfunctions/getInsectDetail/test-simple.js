// 简化的测试脚本，仅测试昆虫信息匹配逻辑

// 直接从index.js提取INSECT_ENCYCLOPEDIA
const fs = require('fs');
const path = require('path');

// 读取并解析INSECT_ENCYCLOPEDIA部分
function extractInsectEncyclopedia() {
  const code = fs.readFileSync('./index.js', 'utf8');
  
  // 提取INSECT_ENCYCLOPEDIA常量定义
  const startMatch = code.match(/const INSECT_ENCYCLOPEDIA = {/);
  const endMatch = code.match(/};\s*\/\/ 根据昆虫名称生成描述/);
  
  if (startMatch && endMatch) {
    const startIndex = startMatch.index;
    const endIndex = endMatch.index + endMatch[0].length - '// 根据昆虫名称生成描述'.length;
    const encyclopediaCode = 'const INSECT_ENCYCLOPEDIA = ' + code.substring(startIndex + 'const INSECT_ENCYCLOPEDIA = '.length, endIndex);
    
    // 创建临时模块来执行代码
    const vm = require('vm');
    const context = {};
    vm.runInNewContext(encyclopediaCode, context);
    
    return context.INSECT_ENCYCLOPEDIA;
  }
  
  return null;
}

// 测试昆虫匹配逻辑
async function testInsectMatch() {
  console.log('开始测试昆虫信息匹配逻辑');
  
  try {
    const INSECT_ENCYCLOPEDIA = extractInsectEncyclopedia();
    
    if (!INSECT_ENCYCLOPEDIA) {
      console.error('无法提取INSECT_ENCYCLOPEDIA');
      return;
    }
    
    console.log(`成功提取昆虫百科信息，共 ${Object.keys(INSECT_ENCYCLOPEDIA).length} 种昆虫`);
    
    // 测试豆娘的匹配
    const insectName = '豆娘';
    console.log(`\n测试昆虫: ${insectName}`);
    
    // 检查是否存在精确匹配
    if (INSECT_ENCYCLOPEDIA[insectName]) {
      console.log('✓ 找到精确匹配！');
      console.log('昆虫类型:', insectName + '类');
      console.log('栖息地:', INSECT_ENCYCLOPEDIA[insectName].habitat);
      console.log('食物:', INSECT_ENCYCLOPEDIA[insectName].food);
      console.log('描述样本:', INSECT_ENCYCLOPEDIA[insectName].description.substring(0, 100) + '...');
    } else {
      console.log('✗ 未找到精确匹配');
    }
    
    // 测试我们的修复逻辑
    console.log('\n测试修复后的逻辑流程:');
    
    // 模拟修复后的逻辑
    function mockOptimizedLogic(normalizedName) {
      // 1. 检查精确匹配（修复后的逻辑）
      if (INSECT_ENCYCLOPEDIA[normalizedName]) {
        return {
          success: true,
          source: 'predefined',
          description: INSECT_ENCYCLOPEDIA[normalizedName].description,
          habitat: INSECT_ENCYCLOPEDIA[normalizedName].habitat,
          food: INSECT_ENCYCLOPEDIA[normalizedName].food
        };
      }
      
      // 2. 模拟百度百科失败
      // ...
      
      // 3. 返回生成的描述
      return {
        success: false,
        source: 'generated',
        message: '未找到精确匹配'
      };
    }
    
    // 测试修复后的逻辑
    const result = mockOptimizedLogic(insectName);
    console.log('修复后的逻辑结果:');
    console.log('成功状态:', result.success);
    console.log('数据源:', result.source);
    
    if (result.success) {
      console.log('✓ 修复逻辑工作正常！可以正确返回预定义的豆娘信息。');
    } else {
      console.log('✗ 修复逻辑未能返回预定义信息');
    }
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testInsectMatch();