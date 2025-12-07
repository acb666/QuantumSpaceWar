const mongoose = require('mongoose');

// 数据库配置
const dbConfig = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/quantumspacewar_dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  production: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/quantumspacewar',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  }
};

// 连接数据库函数
const connectDatabase = async () => {
  try {
    const env = process.env.NODE_ENV || 'development';
    const config = dbConfig[env];
    
    console.log(`🔗 Connecting to MongoDB (${env})...`);
    
    await mongoose.connect(config.uri, config.options);
    
    console.log('✅ MongoDB connected successfully');
    
    // 监听连接事件
    mongoose.connection.on('connected', () => {
      console.log('📡 MongoDB connected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📡 MongoDB disconnected');
    });
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = {
  connectDatabase,
  dbConfig
};