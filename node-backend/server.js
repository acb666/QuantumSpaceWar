const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 路由导入
const authRoutes = require('./routes/auth');
const guideRoutes = require('./routes/guides');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// Socket.IO 导入
const { createServer } = require('http');
const { Server } = require('socket.io');
const ChatSocketService = require('./services/chatSocket');
const { connectDatabase } = require('./config/database');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// 初始化Socket服务
const chatSocketService = new ChatSocketService(io);

// 全局变量
app.locals.io = io;

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined'));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP每15分钟最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || true,
  credentials: true
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '验证错误',
      details: err.errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: '无效的ID格式'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      error: '数据已存在'
    });
  }
  
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器暂时无法处理请求'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    message: `无法找到 ${req.method} ${req.originalUrl}`
  });
});

// 连接数据库
connectDatabase();

// 启动服务器
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // 初始化Socket服务
    const chatSocketService = new ChatSocketService(io);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Node.js服务器运行在端口 ${PORT}`);
      console.log(`📡 Socket.IO 已启动`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API文档: http://localhost:${PORT}/api-docs`);
    });
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM，优雅关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('数据库连接已关闭');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT，优雅关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('数据库连接已关闭');
      process.exit(0);
    });
  });
});

// 启动服务器
startServer();

module.exports = { app, server, io };