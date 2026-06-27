// 昆虫图鉴小程序 - 示例数据填充脚本
// 此脚本用于在微信开发者工具中通过云开发控制台执行，为数据库添加初始示例数据

/**
 * 使用说明：
 * 1. 打开微信开发者工具
 * 2. 进入云开发控制台
 * 3. 选择数据库
 * 4. 点击任意集合
 * 5. 点击"数据"标签页右上角的"+添加记录"
 * 6. 点击"云函数调试"按钮
 * 7. 选择一个云函数环境
 * 8. 将下面的代码复制到调试输入框中
 * 9. 点击"运行"按钮执行数据填充
 */

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 主函数
exports.main = async () => {
  try {
    // 1. 创建示例用户数据
    const usersResult = await fillUsers();
    
    // 2. 创建示例勋章数据
    const badgesResult = await fillBadges();
    
    // 3. 创建示例冷知识数据
    const funFactsResult = await fillFunFacts();
    
    return {
      success: true,
      message: '示例数据填充成功',
      users: usersResult,
      badges: badgesResult,
      funFacts: funFactsResult
    };
  } catch (error) {
    console.error('数据填充失败:', error);
    return {
      success: false,
      message: '数据填充失败',
      error: error.message
    };
  }
};

// 填充用户示例数据
async function fillUsers() {
  try {
    const users = [
      {
        _id: 'user1',
        openId: 'sample_openid_1',
        nickName: '昆虫爱好者小王',
        avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTL7nDfQ6nQz7qEa4iaW7bZ2k4X8jO6q9XJiaLtU6VJj6Zg/132',
        foundCount: 15,
        badgeCount: 3,
        createdAt: db.serverDate(),
        lastLoginAt: db.serverDate()
      },
      {
        _id: 'user2', 
        openId: 'sample_openid_2',
        nickName: '自然探索家',
        avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTL8nEeE6mQz8qEa5iaW8bZ3k5X9jO7q0XJiaMtU7VJj7Zg/132',
        foundCount: 8,
        badgeCount: 2,
        createdAt: db.serverDate(),
        lastLoginAt: db.serverDate()
      }
    ];
    
    // 插入用户数据
    for (const user of users) {
      try {
        await db.collection('users').doc(user._id).set({
          data: user
        });
      } catch (e) {
        console.log(`用户 ${user.nickName} 可能已存在，跳过`);
      }
    }
    
    return { added: users.length, message: '用户示例数据填充完成' };
  } catch (error) {
    console.error('填充用户数据失败:', error);
    throw error;
  }
}

// 填充勋章示例数据
async function fillBadges() {
  try {
    const badges = [
      {
        _id: 'badge1',
        name: '昆虫探索者',
        description: '首次识别10种不同的昆虫',
        icon: '/images/icons/badge_explorer.png',
        condition: '识别10种昆虫',
        points: 100,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      },
      {
        _id: 'badge2',
        name: '自然观察家',
        description: '连续7天使用昆虫图鉴',
        icon: '/images/icons/badge_observer.png',
        condition: '连续7天登录',
        points: 200,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      },
      {
        _id: 'badge3',
        name: '知识分享者',
        description: '分享10条昆虫冷知识',
        icon: '/images/icons/badge_sharer.png',
        condition: '分享10条冷知识',
        points: 150,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    ];
    
    // 插入勋章数据
    for (const badge of badges) {
      try {
        await db.collection('badges').doc(badge._id).set({
          data: badge
        });
      } catch (e) {
        console.log(`勋章 ${badge.name} 可能已存在，跳过`);
      }
    }
    
    return { added: badges.length, message: '勋章示例数据填充完成' };
  } catch (error) {
    console.error('填充勋章数据失败:', error);
    throw error;
  }
}

// 填充冷知识示例数据
async function fillFunFacts() {
  try {
    const funFacts = [
      {
        _id: 'fact1',
        title: '蚂蚁的力量',
        content: '蚂蚁可以搬动比自己体重重50倍的物体，相当于一个成年人搬动一辆小汽车！',
        insectType: '蚂蚁',
        likes: 128,
        images: [],
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
        createdBy: 'sample_admin'
      },
      {
        _id: 'fact2',
        title: '蝴蝶的视觉',
        content: '蝴蝶的眼睛由上万个小眼睛组成，能够看到人类看不到的紫外线，帮助它们找到花朵。',
        insectType: '蝴蝶',
        likes: 96,
        images: [],
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
        createdBy: 'sample_admin'
      },
      {
        _id: 'fact3',
        title: '蝉的寿命',
        content: '蝉在地下可能生活数年甚至十几年，而爬出地面后只有短短几周的寿命。',
        insectType: '蝉',
        likes: 85,
        images: [],
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
        createdBy: 'sample_admin'
      }
    ];
    
    // 插入冷知识数据
    for (const fact of funFacts) {
      try {
        await db.collection('fun_facts').doc(fact._id).set({
          data: fact
        });
      } catch (e) {
        console.log(`冷知识 ${fact.title} 可能已存在，跳过`);
      }
    }
    
    return { added: funFacts.length, message: '冷知识示例数据填充完成' };
  } catch (error) {
    console.error('填充冷知识数据失败:', error);
    throw error;
  }
}

/**
 * 手动执行说明：
 * 如果无法通过云函数调试执行，您也可以手动在云开发控制台中添加数据：
 * 1. 进入数据库
 * 2. 选择要添加数据的集合
 * 3. 点击"+添加记录"
 * 4. 手动输入JSON格式的数据
 *
 * 示例数据（可直接复制使用）：
 * 
 * 用户数据示例：
 * {
 *   "nickName": "昆虫爱好者小王",
 *   "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTL7nDfQ6nQz7qEa4iaW7bZ2k4X8jO6q9XJiaLtU6VJj6Zg/132",
 *   "foundCount": 15,
 *   "badgeCount": 3
 * }
 *
 * 勋章数据示例：
 * {
 *   "name": "昆虫探索者",
 *   "description": "首次识别10种不同的昆虫",
 *   "icon": "/images/icons/badge_explorer.png",
 *   "condition": "识别10种昆虫",
 *   "points": 100
 * }
 *
 * 冷知识数据示例：
 * {
 *   "title": "蚂蚁的力量",
 *   "content": "蚂蚁可以搬动比自己体重重50倍的物体，相当于一个成年人搬动一辆小汽车！",
 *   "insectType": "蚂蚁",
 *   "likes": 128
 * }
 */