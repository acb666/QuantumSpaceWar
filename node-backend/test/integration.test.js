// 测试脚本 - 用于测试Node.js后端功能
const axios = require('axios');
const io = require('socket.io-client');

// 测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3001/api',
  socketURL: 'http://localhost:3001',
  timeout: 5000,
};

// 测试用户数据
const testUsers = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'password123'
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'password123'
  }
];

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 测试工具函数
class TestRunner {
  constructor() {
    this.results = [];
    this.tokens = {};
    this.currentUser = null;
  }

  log(message, type = 'info') {
    const color = colors[type] || colors.blue;
    console.log(`${color}${message}${colors.reset}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async test(name, testFn) {
    try {
      this.log(`测试: ${name}`, 'yellow');
      await testFn();
      this.results.push({ name, status: 'PASS' });
      this.log(`✓ ${name} - 通过`, 'green');
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      this.log(`✗ ${name} - 失败: ${error.message}`, 'red');
    }
  }

  async runAllTests() {
    this.log('开始 Node.js 后端功能测试...', 'blue');
    this.log('=====================================', 'blue');

    // 运行所有测试
    await this.testHealthCheck();
    await this.testUserRegistration();
    await this.testUserLogin();
    await this.testAuthentication();
    await this.testGuideOperations();
    await this.testChatOperations();
    await this.testSocketConnection();
    await this.testRealTimeChat();

    // 显示测试结果
    this.displayResults();
  }

  displayResults() {
    this.log('\n=====================================', 'blue');
    this.log('测试结果汇总:', 'blue');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    this.log(`总测试数: ${this.results.length}`, 'blue');
    this.log(`通过: ${passed}`, 'green');
    this.log(`失败: ${failed}`, 'red');
    
    if (failed > 0) {
      this.log('\n失败的测试:', 'red');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          this.log(`- ${r.name}: ${r.error}`, 'red');
        });
    }
  }

  // 健康检查测试
  async testHealthCheck() {
    await this.test('健康检查', async () => {
      const response = await axios.get(`${TEST_CONFIG.baseURL}/health`);
      if (response.data.status !== 'OK') {
        throw new Error('健康检查失败');
      }
    });
  }

  // 用户注册测试
  async testUserRegistration() {
    await this.test('用户注册', async () => {
      for (const user of testUsers) {
        try {
          const response = await axios.post(`${TEST_CONFIG.baseURL}/auth/register`, user);
          if (!response.data.success) {
            throw new Error(`注册失败: ${response.data.message}`);
          }
          this.log(`用户 ${user.username} 注册成功`, 'green');
        } catch (error) {
          if (error.response?.data?.message?.includes('已存在')) {
            this.log(`用户 ${user.username} 已存在，跳过注册`, 'yellow');
          } else {
            throw error;
          }
        }
      }
    });
  }

  // 用户登录测试
  async testUserLogin() {
    await this.test('用户登录', async () => {
      for (const user of testUsers) {
        const response = await axios.post(`${TEST_CONFIG.baseURL}/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        if (!response.data.success) {
          throw new Error(`登录失败: ${response.data.message}`);
        }
        
        this.tokens[user.username] = response.data.data.token;
        this.log(`用户 ${user.username} 登录成功`, 'green');
      }
    });
  }

  // 认证测试
  async testAuthentication() {
    await this.test('用户认证', async () => {
      const token = this.tokens.testuser1;
      const response = await axios.get(`${TEST_CONFIG.baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.success) {
        throw new Error(`认证失败: ${response.data.message}`);
      }
      
      this.currentUser = response.data.data.user;
      this.log(`用户认证成功: ${this.currentUser.username}`, 'green');
    });
  }

  // 攻略操作测试
  async testGuideOperations() {
    await this.test('攻略操作', async () => {
      const token = this.tokens.testuser1;
      
      // 创建攻略
      const createResponse = await axios.post(
        `${TEST_CONFIG.baseURL}/guides`,
        {
          title: '测试攻略',
          content: '这是一个测试攻略内容',
          category: 'general',
          difficulty: 'beginner'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!createResponse.data.success) {
        throw new Error(`创建攻略失败: ${createResponse.data.message}`);
      }
      
      const guideId = createResponse.data.data.guide._id;
      this.log(`攻略创建成功: ${guideId}`, 'green');
      
      // 获取攻略列表
      const listResponse = await axios.get(`${TEST_CONFIG.baseURL}/guides`);
      if (!listResponse.data.success) {
        throw new Error(`获取攻略列表失败: ${listResponse.data.message}`);
      }
      this.log(`获取攻略列表成功: ${listResponse.data.data.guides.length} 个攻略`, 'green');
      
      // 点赞攻略
      const likeResponse = await axios.post(
        `${TEST_CONFIG.baseURL}/guides/${guideId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!likeResponse.data.success) {
        throw new Error(`点赞攻略失败: ${likeResponse.data.message}`);
      }
      this.log(`攻略点赞成功`, 'green');
    });
  }

  // 聊天操作测试
  async testChatOperations() {
    await this.test('聊天操作', async () => {
      const token = this.tokens.testuser1;
      
      // 获取聊天室列表
      const roomsResponse = await axios.get(`${TEST_CONFIG.baseURL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!roomsResponse.data.success) {
        throw new Error(`获取聊天室失败: ${roomsResponse.data.message}`);
      }
      
      this.log(`获取聊天室成功: ${roomsResponse.data.data.rooms.length} 个房间`, 'green');
      
      // 创建聊天室
      const createRoomResponse = await axios.post(
        `${TEST_CONFIG.baseURL}/chat/rooms`,
        {
          name: '测试房间',
          description: '这是一个测试聊天室',
          maxMembers: 10
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!createRoomResponse.data.success) {
        throw new Error(`创建聊天室失败: ${createRoomResponse.data.message}`);
      }
      
      const roomId = createRoomResponse.data.data.room._id;
      this.log(`聊天室创建成功: ${roomId}`, 'green');
    });
  }

  // Socket 连接测试
  async testSocketConnection() {
    await this.test('Socket 连接', async () => {
      const token = this.tokens.testuser1;
      
      return new Promise((resolve, reject) => {
        const socket = io(TEST_CONFIG.socketURL, {
          auth: { token }
        });
        
        socket.on('connect', () => {
          this.log('Socket 连接成功', 'green');
          socket.disconnect();
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          reject(new Error(`Socket 连接失败: ${error.message}`));
        });
        
        // 5秒后超时
        setTimeout(() => {
          socket.disconnect();
          reject(new Error('Socket 连接超时'));
        }, 5000);
      });
    });
  }

  // 实时聊天测试
  async testRealTimeChat() {
    await this.test('实时聊天', async () => {
      const token1 = this.tokens.testuser1;
      const token2 = this.tokens.testuser2;
      
      return new Promise(async (resolve, reject) => {
        try {
          // 创建聊天室
          const roomResponse = await axios.post(
            `${TEST_CONFIG.baseURL}/chat/rooms`,
            { name: '测试聊天', description: '实时聊天测试', maxMembers: 5 },
            { headers: { Authorization: `Bearer ${token1}` } }
          );
          
          const roomId = roomResponse.data.data.room._id;
          
          // 连接两个用户
          const socket1 = io(TEST_CONFIG.socketURL, { auth: { token: token1 } });
          const socket2 = io(TEST_CONFIG.socketURL, { auth: { token: token2 } });
          
          let messageReceived = false;
          
          socket2.on('new-message', (data) => {
            if (data.message.content === '测试消息') {
              messageReceived = true;
              this.log('实时消息接收成功', 'green');
              socket1.disconnect();
              socket2.disconnect();
              resolve();
            }
          });
          
          // 等待连接
          await this.delay(1000);
          
          // 用户1加入房间并发送消息
          socket1.emit('join-room', roomId);
          await this.delay(500);
          
          socket1.emit('send-message', {
            roomId,
            content: '测试消息',
            messageType: 'text'
          });
          
          // 5秒后检查是否收到消息
          setTimeout(() => {
            if (!messageReceived) {
              socket1.disconnect();
              socket2.disconnect();
              reject(new Error('实时聊天测试超时'));
            }
          }, 5000);
          
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

// 运行测试
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;