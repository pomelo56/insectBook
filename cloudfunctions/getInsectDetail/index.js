// 简化版本的昆虫详情云函数
// 专注于基本功能，避免复杂的外部依赖和API调用
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 昆虫百科基础信息
const INSECT_ENCYCLOPEDIA = {
  '蝴蝶': {
    description: '蝴蝶是昆虫纲鳞翅目锤角亚目的统称。\n\n特征：\n- 身体分为头、胸、腹三部分\n- 有两对色彩鲜艳的翅膀\n- 触角棒状\n\n习性：\n- 多数以花蜜为食\n- 完全变态发育：卵→幼虫→蛹→成虫\n- 种类繁多，全球约有14000种\n\n观察提示：蝴蝶喜欢在阳光充足的地方活动，早晨和傍晚较为活跃。',
    habitat: '广泛分布于各种陆地环境',
    food: '花蜜、树汁等液体食物'
  },
  '蜜蜂': {
    description: '蜜蜂是社会性昆虫，属于膜翅目蜜蜂科。\n\n特征：\n- 体表有绒毛\n- 后足特化为花粉篮\n- 具有螫针（工蜂）\n\n习性：\n- 群体生活，有明确分工\n- 采集花粉和花蜜\n- 能够通过舞蹈传递信息\n\n观察提示：蜜蜂是重要的授粉昆虫，请勿惊扰蜂群。',
    habitat: '蜂巢，常筑于树洞或人工蜂箱',
    food: '花蜜、花粉'
  },
  '蚂蚁': {
    description: '蚂蚁是膜翅目蚁科昆虫的统称，是地球上最成功的昆虫类群之一。\n\n特征：\n- 身体分为头、胸、腹三部分\n- 触角膝状\n- 腹部有结节\n\n习性：\n- 高度社会性，分工明确\n- 营巢生活\n- 杂食性，有些种类会放牧蚜虫\n\n观察提示：观察蚂蚁的搬运行为非常有趣，可以放置小食物观察它们的协作。',
    habitat: '地下、树洞、建筑物等',
    food: '多种有机物'
  },
  '螳螂': {
    description: '螳螂是螳螂目昆虫的统称，以捕食其他昆虫为生。\n\n特征：\n- 头部三角形，可灵活转动\n- 前足特化为捕捉足\n- 身体细长\n\n习性：\n- 肉食性，捕食活的昆虫\n- 静候捕食策略\n- 有些种类有性食同类现象\n\n观察提示：螳螂是出色的捕食者，可以观察它们如何捕捉猎物。',
    habitat: '草丛、灌木等植被中',
    food: '其他昆虫'
  },
  '蜻蜓': {
    description: '蜻蜓是蜻蜓目昆虫的统称，是飞行能力极强的昆虫。\n\n特征：\n- 复眼大而突出\n- 两对透明翅膀，翅脉网状\n- 细长的腹部\n\n习性：\n- 捕食飞行中的昆虫\n- 不完全变态发育\n- 稚虫生活在水中\n\n观察提示：蜻蜓常在水域附近活动，捕食蚊子等小昆虫。',
    habitat: '水域附近',
    food: '飞行中的小型昆虫'
  },
  '豆娘': {
    description: '豆娘是蜻蜓目束翅亚目昆虫的统称，体型较蜻蜓小。\n\n特征：\n- 体细长\n- 两对翅大小相似，休息时翅束立于背上\n- 复眼距离较远\n\n习性：\n- 生活在水域附近\n- 捕食小型昆虫\n- 稚虫生活在水中\n\n观察提示：豆娘常栖息于水域附近的植物上，可以观察它们交配时形成的"爱心"形状。',
    habitat: '水域附近，尤其喜欢静水区域',
    food: '小型昆虫'
  },
  '蝉': {
    description: '蝉是半翅目蝉科昆虫的统称，以其响亮的鸣叫声著称。\n\n特征：\n- 复眼发达\n- 触角短\n- 雄性腹部有发音器\n\n习性：\n- 雄蝉通过鸣叫吸引雌蝉\n- 若虫生活在地下，吸食植物根部汁液\n- 成虫寿命较短，通常只有数周\n\n观察提示：夏季是蝉活动的高峰期，可以在树干上寻找蝉蜕或聆听蝉鸣。',
    habitat: '树木茂盛的地区',
    food: '植物汁液'
  }
};

// 生成基本描述
function generateBasicDescription(insectName) {
  return `这是关于${insectName}的基本信息。\n\n昆虫是地球上种类最多的生物类群，它们具有独特的生物学特征和生活习性。\n\n特征：\n- 身体分为头、胸、腹三部分\n- 大多数成虫有三对足和两对翅\n- 具有外骨骼\n\n观察提示：仔细观察昆虫的形态特征和行为，可以发现许多有趣的生物学现象。`;
}

// 主函数
exports.main = async (event, context) => {
  try {
    console.log('获取昆虫详情参数:', event);
    
    // 获取传入的昆虫ID或名称
    const { insectId, insectName } = event;
    const debugLogs = [];
    
    // 尝试从数据库获取昆虫信息
    let insectInfo = null;
    let externalId = '';
    
    try {
      // 判断输入的ID是否为externalId格式（以"insect_"开头）
      if (insectId && insectId.startsWith('insect_')) {
        // 使用externalId查询数据库，包含encyclopedia字段
        const dbResult = await db.collection('insects')
          .where({ externalId: insectId })
          .field({ name: true, externalId: true, createTime: true, recognitionCount: true, encyclopedia: true })
          .get();
          
        if (dbResult.data && dbResult.data.length > 0) {
          insectInfo = dbResult.data[0];
          externalId = insectInfo.externalId || '';
          debugLogs.push(`通过externalId从数据库获取到昆虫信息: ${insectInfo.name}`);
        }
      } else if (insectId) {
        // 使用_id查询数据库，包含encyclopedia字段
        const dbResult = await db.collection('insects')
          .where({ _id: insectId })
          .field({ name: true, externalId: true, createTime: true, recognitionCount: true, encyclopedia: true })
          .get();
          
        if (dbResult.data && dbResult.data.length > 0) {
          insectInfo = dbResult.data[0];
          externalId = insectInfo.externalId || '';
          debugLogs.push(`通过_id从数据库获取到昆虫信息: ${insectInfo.name}`);
        }
      }
    } catch (dbError) {
      console.warn('数据库查询失败:', dbError);
      debugLogs.push(`数据库查询失败: ${dbError.message}`);
    }
    
    // 确定昆虫名称
    let normalizedName = insectInfo?.name || insectName || '未知昆虫';
    
    // 尝试获取统计信息
    let foundCount = 0;
    let lastFoundDate = '';
    let imageUrl = '';
    
    try {
      const userInsectsResult = await db.collection('user_insects')
        .where({ insectId: insectId || normalizedName })
        .orderBy('lastFoundTime', 'desc')
        .get();
        
      if (userInsectsResult.data && userInsectsResult.data.length > 0) {
        foundCount = userInsectsResult.data.reduce((total, record) => {
          return total + (record.foundCount || 0);
        }, 0);
        
        const latestRecord = userInsectsResult.data[0];
        if (latestRecord.lastFoundTime) {
          lastFoundDate = new Date(latestRecord.lastFoundTime).toLocaleDateString();
        }
        
        if (latestRecord.userImageUrl) {
          imageUrl = latestRecord.userImageUrl;
        }
      }
    } catch (e) {
      console.warn('获取统计信息失败:', e);
    }
    
    // 优先使用数据库中保存的百科信息
    if (insectInfo && insectInfo.encyclopedia) {
      debugLogs.push(`使用数据库中保存的百科信息: ${normalizedName}`);
      return {
        success: true,
        name: normalizedName,
        description: typeof insectInfo.encyclopedia === 'string' ? insectInfo.encyclopedia : (insectInfo.encyclopedia.description || ''),
        habitat: typeof insectInfo.encyclopedia === 'object' ? (insectInfo.encyclopedia.habitat || '') : '',
        food: typeof insectInfo.encyclopedia === 'object' ? (insectInfo.encyclopedia.food || '') : '',
        category: normalizedName + '类',
        source: 'database',
        externalId: externalId,
        foundCount: foundCount,
        lastFoundDate: lastFoundDate,
        imageUrl: imageUrl,
        encyclopedia: insectInfo.encyclopedia,
        debugLogs: debugLogs,
        createTime: insectInfo?.createTime || '',
        recognitionCount: insectInfo?.recognitionCount || 0,
        id: externalId || insectId
      };
    }
    
    // 如果数据库中没有百科信息，才使用预定义的百科信息
    if (INSECT_ENCYCLOPEDIA[normalizedName]) {
      debugLogs.push(`使用预定义百科信息: ${normalizedName}`);
      return {
        success: true,
        name: normalizedName,
        description: INSECT_ENCYCLOPEDIA[normalizedName].description,
        habitat: INSECT_ENCYCLOPEDIA[normalizedName].habitat,
        food: INSECT_ENCYCLOPEDIA[normalizedName].food,
        category: normalizedName + '类',
        source: 'predefined',
        externalId: externalId,
        foundCount: foundCount,
        lastFoundDate: lastFoundDate,
        imageUrl: imageUrl,
        encyclopedia: INSECT_ENCYCLOPEDIA[normalizedName],
        debugLogs: debugLogs,
        createTime: insectInfo?.createTime || '',
        recognitionCount: insectInfo?.recognitionCount || 0,
        id: externalId || insectId
      };
    }
    
    // 如果没有预定义信息，使用基本描述
    const description = generateBasicDescription(normalizedName);
    const basicEncyclopedia = {
      description: description,
      habitat: '未知',
      food: '未知'
    };
    
    return {
      success: true,
      name: normalizedName,
      description: description,
      category: '未知',
      habitat: '未知',
      food: '未知',
      source: 'generated',
      externalId: externalId,
      foundCount: foundCount,
      lastFoundDate: lastFoundDate,
      imageUrl: imageUrl,
      encyclopedia: basicEncyclopedia,
      debugLogs: debugLogs,
      // 保留数据库中的原始字段，包括createTime和recognitionCount
      createTime: insectInfo?.createTime || '',
      recognitionCount: insectInfo?.recognitionCount || 0,
      id: externalId || insectId
    };
    
  } catch (error) {
    console.error('云函数执行错误:', error);
    const fallbackEncyclopedia = {
      description: `关于${event.insectName || '该昆虫'}的详细信息暂时无法获取。`,
      habitat: '',
      food: ''
    };
    return {
      success: true, // 即使出错也返回成功标志，确保前端能正常显示
      name: event.insectName || '未知昆虫',
      description: `关于${event.insectName || '该昆虫'}的详细信息暂时无法获取。`,
      category: '未知',
      habitat: '',
      food: '',
      source: 'error_fallback',
      error: error.message,
      foundCount: 0,
      lastFoundDate: '',
      imageUrl: '',
      externalId: '',
      encyclopedia: fallbackEncyclopedia
    };
  }
};