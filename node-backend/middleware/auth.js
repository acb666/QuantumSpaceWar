const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '访问令牌缺失' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // 检查用户是否仍然存在且活跃
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在或已被禁用' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(403).json({ 
      success: false, 
      message: '访问令牌无效' 
    });
  }
};

// 可选认证中间件（用于需要认证但不强制的情况）
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // 令牌无效时继续，但不设置req.user
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthenticate
};