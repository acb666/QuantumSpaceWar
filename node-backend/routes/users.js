const express = require('express');
const { User } = require('../models');
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取用户列表（仅管理员）
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员
    const requestingUser = await User.findById(req.user.userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限访问用户列表' 
      });
    }

    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 获取当前用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, bio, avatar, preferences } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    // 更新用户信息
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };

    user.updatedAt = new Date();
    await user.save();

    // 返回更新后的用户信息（不包含密码）
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被使用'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 获取用户统计信息
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    // 获取用户统计信息
    const stats = {
      guidesCount: await User.countDocuments({ author: userId }),
      joinDate: user.createdAt,
      lastActive: user.lastActive,
      role: user.role,
      isActive: user.isActive
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('获取用户统计信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 更新用户活跃度
router.post('/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    await User.findByIdAndUpdate(userId, {
      lastActive: new Date()
    });

    res.json({
      success: true,
      message: '用户活跃度已更新'
    });
  } catch (error) {
    console.error('更新用户活跃度错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 删除用户账户（仅管理员或用户本人）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requestingUserId = req.user.userId;

    const requestingUser = await User.findById(requestingUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    // 检查权限：只有管理员或用户本人可以删除账户
    const isAdmin = requestingUser.role === 'admin';
    const isSelf = requestingUserId === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限删除此用户' 
      });
    }

    // 不能删除自己如果是最后一个管理员
    if (isSelf && requestingUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: '不能删除最后一个管理员账户' 
        });
      }
    }

    await User.findByIdAndDelete(targetUserId);

    res.json({
      success: true,
      message: '用户账户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;