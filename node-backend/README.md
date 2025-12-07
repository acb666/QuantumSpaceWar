# Quantum Space War - Node.js Backend

这是一个基于 Node.js + Express + MongoDB 的后端服务，为量子太空杀游戏提供 API 支持。

## 功能特性

### 用户认证
- ✅ 用户注册
- ✅ 用户登录
- ✅ JWT 令牌认证
- ✅ 用户信息管理

### 攻略管理
- ✅ 攻略 CRUD 操作
- ✅ 攻略分类和搜索
- ✅ 点赞功能
- ✅ 评论系统
- ✅ 浏览统计

### 实时聊天
- ✅ WebSocket 实时通信
- ✅ 聊天室管理
- ✅ 消息历史记录
- ✅ 输入状态提示
- ✅ 系统消息

### 数据库
- ✅ MongoDB 集成
- ✅ Mongoose ODM
- ✅ 数据验证
- ✅ 索引优化

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB
- **实时通信**: Socket.IO
- **认证**: JWT
- **密码加密**: bcryptjs
- **环境变量**: dotenv
- **CORS**: cors

## 快速开始

### 1. 安装依赖

```bash
cd node-backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改相关配置：

```bash
cp .env.example .env
```

### 3. 启动 MongoDB

确保本地 MongoDB 服务已启动，或使用 MongoDB Atlas 云服务。

### 4. 启动服务器

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 文档

### 认证相关

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 攻略相关

#### 获取攻略列表
```http
GET /api/guides?page=1&limit=10&category=basic&difficulty=easy&search=关键词
```

#### 获取攻略详情
```http
GET /api/guides/:id
```

#### 创建攻略（需要认证）
```http
POST /api/guides
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新手攻略",
  "content": "攻略内容...",
  "category": "basic",
  "difficulty": "easy",
  "tags": ["新手", "入门"],
  "gameVersion": "1.0.0"
}
```

#### 点赞攻略（需要认证）
```http
POST /api/guides/:id/like
Authorization: Bearer <token>
```

#### 添加评论（需要认证）
```http
POST /api/guides/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "这条攻略很有用！"
}
```

### 聊天相关

#### 获取聊天室列表（需要认证）
```http
GET /api/chat/rooms
Authorization: Bearer <token>
```

#### 创建聊天室（需要认证）
```http
POST /api/chat/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新手交流群",
  "participants": ["userId1", "userId2"],
  "isPrivate": false
}
```

#### 获取聊天室消息（需要认证）
```http
GET /api/chat/rooms/:roomId/messages?page=1&limit=50
Authorization: Bearer <token>
```

#### 发送消息（需要认证）
```http
POST /api/chat/rooms/:roomId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "大家好！",
  "messageType": "text"
}
```

### WebSocket 事件

#### 客户端发送事件
- `authenticate` - 用户认证
- `join-room` - 加入聊天室
- `leave-room` - 离开聊天室
- `send-message` - 发送消息
- `typing` - 输入状态

#### 服务器发送事件
- `authenticated` - 认证成功
- `auth-error` - 认证失败
- `user-joined` - 用户加入
- `user-left` - 用户离开
- `new-message` - 新消息
- `system-message` - 系统消息
- `user-typing` - 用户输入状态
- `room-users` - 房间用户列表

## 项目结构

```
node-backend/
├── config/           # 配置文件
│   └── database.js   # 数据库配置
├── middleware/       # 中间件
│   └── auth.js      # 认证中间件
├── models/          # 数据模型
│   └── index.js    # 所有模型定义
├── routes/         # API 路由
│   ├── auth.js     # 认证路由
│   ├── guides.js   # 攻略路由
│   └── chat.js     # 聊天路由
├── services/       # 业务逻辑
│   └── chatSocket.js # WebSocket 服务
├── server.js       # 主服务器文件
├── package.json    # 项目依赖
└── .env.example    # 环境变量示例
```

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务器端口 | 5000 |
| MONGODB_URI | MongoDB 连接字符串 | mongodb://localhost:27017/quantumspacewar |
| JWT_SECRET | JWT 密钥 | 随机字符串 |
| FRONTEND_URL | 前端 URL | http://localhost:3000 |

## 开发建议

1. **代码规范**: 遵循 ESLint 配置
2. **提交规范**: 使用有意义的提交信息
3. **分支管理**: 使用功能分支开发
4. **测试**: 编写单元测试和集成测试
5. **文档**: 及时更新 API 文档

## 注意事项

- ✅ 本后端服务与现有的 Python Django 服务完全独立，不会发生冲突
- ✅ 使用不同的端口（默认 5000）
- ✅ 使用独立的数据库（MongoDB）
- ✅ 提供 RESTful API 和 WebSocket 支持
- ✅ 支持现代前端框架集成

## 支持与维护

如遇到问题，请检查：
1. MongoDB 服务是否正常运行
2. 环境变量配置是否正确
3. 端口是否被占用
4. 网络连接是否正常

## 许可证

MIT License