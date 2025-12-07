// 前端集成配置
const FRONTEND_CONFIG = {
  // API 基础配置
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',
  
  // 应用配置
  APP_NAME: '量子太空杀',
  APP_VERSION: '1.0.0',
  
  // 功能开关
  FEATURES: {
    CHAT_ENABLED: true,
    GUIDES_ENABLED: true,
    USER_STATS_ENABLED: true,
  },
  
  // 聊天配置
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    TYPING_TIMEOUT: 1000,
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
  },
  
  // 请求配置
  REQUEST: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
  
  // 存储配置
  STORAGE: {
    TOKEN_KEY: 'quantum_game_token',
    USER_KEY: 'quantum_game_user',
    THEME_KEY: 'quantum_game_theme',
  },
  
  // 路由配置
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    GUIDES: '/guides',
    CHAT: '/chat',
    PROFILE: '/profile',
  },
  
  // 主题配置
  THEME: {
    PRIMARY_COLOR: '#1890ff',
    SECONDARY_COLOR: '#52c41a',
    DANGER_COLOR: '#ff4d4f',
    WARNING_COLOR: '#faad14',
  },
};

// 环境配置
const ENV_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3001/api',
    SOCKET_URL: 'http://localhost:3001',
    DEBUG: true,
  },
  production: {
    API_BASE_URL: 'https://your-domain.com/api',
    SOCKET_URL: 'https://your-domain.com',
    DEBUG: false,
  },
  test: {
    API_BASE_URL: 'http://localhost:3001/api',
    SOCKET_URL: 'http://localhost:3001',
    DEBUG: true,
  },
};

// 获取当前环境配置
const getCurrentEnvConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};

// 合并配置
const CONFIG = {
  ...FRONTEND_CONFIG,
  ...getCurrentEnvConfig(),
};

// 导出配置
export default CONFIG;

// 类型定义
/**
 * @typedef {Object} User
 * @property {string} _id - 用户ID
 * @property {string} username - 用户名
 * @property {string} email - 邮箱
 * @property {string} avatar - 头像URL
 * @property {number} level - 等级
 * @property {number} experience - 经验值
 * @property {Object} stats - 统计信息
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * @typedef {Object} Guide
 * @property {string} _id - 攻略ID
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {string} category - 分类
 * @property {string} difficulty - 难度
 * @property {User} author - 作者
 * @property {number} likes - 点赞数
 * @property {Array} comments - 评论
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * @typedef {Object} ChatRoom
 * @property {string} _id - 房间ID
 * @property {string} name - 房间名称
 * @property {string} description - 描述
 * @property {number} memberCount - 成员数
 * @property {number} maxMembers - 最大成员数
 * @property {Array} members - 成员列表
 * @property {User} creator - 创建者
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} _id - 消息ID
 * @property {string} content - 内容
 * @property {string} messageType - 消息类型
 * @property {User} sender - 发送者
 * @property {string} roomId - 房间ID
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 是否成功
 * @property {string} message - 消息
 * @property {Object} data - 数据
 * @property {Object} [error] - 错误信息
 */