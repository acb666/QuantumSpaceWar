// 数据库种子脚本 - 用于初始化测试数据
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Guide, ChatRoom } = require('../models');
require('dotenv').config();

// 种子数据
const seedData = {
  users: [
    {
      username: 'admin',
      email: 'admin@quantum-game.com',
      password: 'admin123',
      level: 10,
      experience: 1000,
      role: 'admin'
    },
    {
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123',
      level: 5,
      experience: 500
    },
    {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123',
      level: 3,
      experience: 300
    },
    {
      username: '新手玩家',
      email: 'newbie@example.com',
      password: 'password123',
      level: 1,
      experience: 0
    }
  ],
  
  guides: [
    {
      title: '新手入门指南',
      content: `欢迎来到量子太空杀！这是一个充满策略和推理的游戏。

基础规则：
1. 游戏中有好人和坏人两个阵营
2. 好人需要完成任务或找出所有坏人
3. 坏人需要破坏任务或消灭好人

新手技巧：
- 仔细观察其他玩家的行为
- 积极参与讨论和投票
- 完成任务获得胜利

祝你游戏愉快！`,
      category: 'beginner',
      difficulty: 'beginner'
    },
    {
      title: '高级策略：如何识别坏人',
      content: `在量子太空杀中，识别坏人是获胜的关键。

观察要点：
1. 行为异常：突然改变路线或停留过久
2. 任务进度：假装做任务但进度条不涨
3. 紧急按钮：不合理地使用紧急会议
4. 投票模式：总是跟风投票或逃避投票

高级技巧：
- 记录每个人的行动轨迹
- 分析投票逻辑和动机
- 利用视觉任务验证身份
- 掌握心理战术`,
      category: 'strategy',
      difficulty: 'advanced'
    },
    {
      title: '任务攻略：高效完成任务',
      content: `任务系统是游戏的核心机制之一。

常见任务类型：
1. 下载数据：简单但需要时间
2. 修复电力：需要多人合作
3. 清理管道：视觉任务，可证明身份
4. 刷卡：需要记忆卡号

任务策略：
- 优先完成视觉任务
- 避开危险区域
- 与可信玩家组队
- 注意任务顺序和逻辑`,
      category: 'strategy',
      difficulty: 'intermediate'
    },
    {
      title: '坏人玩法：完美伪装',
      content: `作为坏人，你的目标是消灭好人而不被发现。

伪装技巧：
1. 模仿好人的行为模式
2. 合理使用破坏技能
3. 制造不在场证明
4. 控制杀人的时机和地点

团队配合：
- 与同伴保持沟通
- 协调破坏和杀人时机
- 互相掩护和作证
- 控制投票走向

记住：最好的坏人看起来就像好人！`,
      category: 'strategy',
      difficulty: 'advanced'
    }
  ],
  
  chatRooms: [
    {
      name: '新手交流区',
      description: '新玩家可以在这里提问和交流',
      maxMembers: 50
    },
    {
      name: '策略讨论区',
      description: '讨论游戏策略和技巧',
      maxMembers: 30
    },
    {
      name: '实时游戏房1',
      description: '实时游戏匹配和组队',
      maxMembers: 10
    },
    {
      name: '实时游戏房2',
      description: '实时游戏匹配和组队',
      maxMembers: 10
    }
  ]
};

// 连接数据库
async function connectDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum-game';
    await mongoose.connect(mongoURI);
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
}

// 清空数据库
async function clearDatabase() {
  try {
    await User.deleteMany({});
    await Guide.deleteMany({});
    await ChatRoom.deleteMany({});
    console.log('数据库已清空');
  } catch (error) {
    console.error('清空数据库失败:', error);
  }
}

// 创建用户
async function createUsers() {
  console.log('开始创建用户...');
  const createdUsers = [];
  
  for (const userData of seedData.users) {
    try {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`用户 ${userData.username} 已存在，跳过`);
        continue;
      }
      
      // 创建新用户
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      createdUsers.push(user);
      console.log(`用户 ${userData.username} 创建成功`);
      
    } catch (error) {
      console.error(`创建用户 ${userData.username} 失败:`, error.message);
    }
  }
  
  return createdUsers;
}

// 创建攻略
async function createGuides(users) {
  console.log('开始创建攻略...');
  const createdGuides = [];
  
  for (let i = 0; i < seedData.guides.length; i++) {
    const guideData = seedData.guides[i];
    const author = users[i % users.length]; // 循环选择作者
    
    try {
      // 检查攻略是否已存在
      const existingGuide = await Guide.findOne({ title: guideData.title });
      if (existingGuide) {
        console.log(`攻略 ${guideData.title} 已存在，跳过`);
        continue;
      }
      
      // 创建新攻略
      const guide = new Guide({
        ...guideData,
        author: author._id,
        likes: Math.floor(Math.random() * 100), // 随机点赞数
        comments: []
      });
      
      await guide.save();
      createdGuides.push(guide);
      console.log(`攻略 ${guideData.title} 创建成功`);
      
    } catch (error) {
      console.error(`创建攻略 ${guideData.title} 失败:`, error.message);
    }
  }
  
  return createdGuides;
}

// 创建聊天室
async function createChatRooms(users) {
  console.log('开始创建聊天室...');
  const createdRooms = [];
  
  for (let i = 0; i < seedData.chatRooms.length; i++) {
    const roomData = seedData.chatRooms[i];
    const creator = users[i % users.length]; // 循环选择创建者
    
    try {
      // 检查聊天室是否已存在
      const existingRoom = await ChatRoom.findOne({ name: roomData.name });
      if (existingRoom) {
        console.log(`聊天室 ${roomData.name} 已存在，跳过`);
        continue;
      }
      
      // 创建新聊天室
      const room = new ChatRoom({
        ...roomData,
        creator: creator._id,
        members: [creator._id],
        memberCount: 1
      });
      
      await room.save();
      createdRooms.push(room);
      console.log(`聊天室 ${roomData.name} 创建成功`);
      
    } catch (error) {
      console.error(`创建聊天室 ${roomData.name} 失败:`, error.message);
    }
  }
  
  return createdRooms;
}

// 主函数
async function seedDatabase() {
  console.log('开始数据库种子化...');
  console.log('=====================================');
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // 询问是否清空数据库
    if (process.argv.includes('--clear')) {
      console.log('清空数据库...');
      await clearDatabase();
    }
    
    // 创建用户
    const users = await createUsers();
    
    if (users.length === 0) {
      console.log('没有新用户被创建');
      return;
    }
    
    // 创建攻略
    await createGuides(users);
    
    // 创建聊天室
    await createChatRooms(users);
    
    console.log('=====================================');
    console.log('数据库种子化完成！');
    console.log(`创建了 ${users.length} 个用户`);
    
  } catch (error) {
    console.error('数据库种子化失败:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}

// 运行种子脚本
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase, seedData };