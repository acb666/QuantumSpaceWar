const express = require('express');
const { ChatRoom, ChatMessage, User } = require('../models');
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取聊天室列表
router.get('/rooms', authMiddleware, async (req, res) => {
  try {
    const rooms = await ChatRoom.find()
      .populate('participants', 'username firstName lastName')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('获取聊天室列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 创建聊天室
router.post('/rooms', authMiddleware, async (req, res) => {
  try {
    const { name, participants, isPrivate = false } = req.body;
    const userId = req.user.userId;

    if (!name || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ 
        success: false, 
        message: '聊天室名称和参与者是必填项' 
      });
    }

    // 确保创建者也在参与者列表中
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const room = new ChatRoom({
      name,
      participants,
      isPrivate,
      createdBy: userId
    });

    await room.save();
    await room.populate('participants', 'username firstName lastName');

    res.status(201).json({
      success: true,
      message: '聊天室创建成功',
      data: { room }
    });
  } catch (error) {
    console.error('创建聊天室错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 获取聊天室消息
router.get('/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;
    const skip = (page - 1) * limit;

    // 检查用户是否在聊天室中
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.participants.includes(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限访问此聊天室' 
      });
    }

    const messages = await ChatMessage.find({ room: roomId })
      .populate('sender', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({ room: roomId });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // 按时间正序返回
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取聊天消息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 发送消息
router.post('/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '消息内容不能为空' 
      });
    }

    // 检查用户是否在聊天室中
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.participants.includes(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限在此聊天室发送消息' 
      });
    }

    const message = new ChatMessage({
      room: roomId,
      sender: userId,
      content: content.trim(),
      messageType
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName');

    // 更新聊天室的最后消息和时间
    room.lastMessage = message._id;
    room.updatedAt = new Date();
    await room.save();

    res.status(201).json({
      success: true,
      message: '消息发送成功',
      data: { message }
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 加入聊天室
router.post('/rooms/:roomId/join', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: '聊天室不存在' 
      });
    }

    if (room.isPrivate) {
      return res.status(403).json({ 
        success: false, 
        message: '无法加入私密聊天室' 
      });
    }

    if (room.participants.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: '已在聊天室中' 
      });
    }

    room.participants.push(userId);
    await room.save();
    await room.populate('participants', 'username firstName lastName');

    // 发送系统消息
    const systemMessage = new ChatMessage({
      room: roomId,
      sender: userId,
      content: `${req.user.username} 加入了聊天室`,
      messageType: 'system'
    });
    await systemMessage.save();

    res.json({
      success: true,
      message: '成功加入聊天室',
      data: { room }
    });
  } catch (error) {
    console.error('加入聊天室错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 离开聊天室
router.post('/rooms/:roomId/leave', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: '聊天室不存在' 
      });
    }

    if (!room.participants.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: '不在聊天室中' 
      });
    }

    room.participants.pull(userId);
    await room.save();

    // 发送系统消息
    const systemMessage = new ChatMessage({
      room: roomId,
      sender: userId,
      content: `${req.user.username} 离开了聊天室`,
      messageType: 'system'
    });
    await systemMessage.save();

    res.json({
      success: true,
      message: '成功离开聊天室'
    });
  } catch (error) {
    console.error('离开聊天室错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 获取用户的聊天室
router.get('/my-rooms', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await ChatRoom.find({ participants: userId })
      .populate('participants', 'username firstName lastName')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('获取用户聊天室错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;