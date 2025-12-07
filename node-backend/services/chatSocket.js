const jwt = require('jsonwebtoken');
const { User, ChatRoom, ChatMessage } = require('../models');

class ChatSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // socketId -> userId
    this.userSockets = new Map(); // userId -> socketId
    this.roomUsers = new Map(); // roomId -> Set of userIds
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('👤 用户连接:', socket.id);
      
      socket.on('authenticate', async (data) => {
        await this.handleAuthentication(socket, data);
      });
      
      socket.on('join-room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });
      
      socket.on('leave-room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });
      
      socket.on('send-message', async (data) => {
        await this.handleSendMessage(socket, data);
      });
      
      socket.on('typing', async (data) => {
        await this.handleTyping(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async handleAuthentication(socket, data) {
    try {
      const { token } = data;
      
      if (!token) {
        socket.emit('auth-error', { message: '认证令牌缺失' });
        return;
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        socket.emit('auth-error', { message: '用户不存在或已被禁用' });
        return;
      }
      
      // 存储用户连接信息
      this.connectedUsers.set(socket.id, {
        userId: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      this.userSockets.set(user._id.toString(), socket.id);
      
      socket.user = {
        userId: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      socket.emit('authenticated', {
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
      
      console.log(`✅ 用户 ${user.username} 认证成功`);
      
    } catch (error) {
      console.error('认证错误:', error);
      socket.emit('auth-error', { message: '认证失败' });
    }
  }

  async handleJoinRoom(socket, data) {
    try {
      if (!socket.user) {
        socket.emit('error', { message: '请先进行身份验证' });
        return;
      }
      
      const { roomId } = data;
      const { userId, username } = socket.user;
      
      // 检查用户是否有权限加入聊天室
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        socket.emit('error', { message: '聊天室不存在' });
        return;
      }
      
      if (!room.participants.includes(userId)) {
        socket.emit('error', { message: '没有权限加入此聊天室' });
        return;
      }
      
      // 加入socket房间
      socket.join(roomId);
      
      // 更新房间用户列表
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId).add(userId);
      
      // 通知聊天室中的其他用户
      socket.to(roomId).emit('user-joined', {
        userId,
        username,
        timestamp: new Date()
      });
      
      // 发送系统消息
      const systemMessage = new ChatMessage({
        room: roomId,
        sender: userId,
        content: `${username} 加入了聊天室`,
        messageType: 'system'
      });
      await systemMessage.save();
      await systemMessage.populate('sender', 'username firstName lastName');
      
      this.io.to(roomId).emit('system-message', {
        message: systemMessage
      });
      
      // 发送房间当前用户列表给新加入的用户
      const roomUsers = Array.from(this.roomUsers.get(roomId) || [])
        .map(uid => {
          const userSocketId = this.userSockets.get(uid);
          const userInfo = this.connectedUsers.get(userSocketId);
          return userInfo ? {
            userId: uid,
            username: userInfo.username,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName
          } : null;
        })
        .filter(Boolean);
      
      socket.emit('room-users', {
        roomId,
        users: roomUsers
      });
      
      console.log(`✅ 用户 ${username} 加入聊天室 ${roomId}`);
      
    } catch (error) {
      console.error('加入聊天室错误:', error);
      socket.emit('error', { message: '加入聊天室失败' });
    }
  }

  async handleLeaveRoom(socket, data) {
    try {
      if (!socket.user) {
        socket.emit('error', { message: '请先进行身份验证' });
        return;
      }
      
      const { roomId } = data;
      const { userId, username } = socket.user;
      
      // 离开socket房间
      socket.leave(roomId);
      
      // 更新房间用户列表
      if (this.roomUsers.has(roomId)) {
        this.roomUsers.get(roomId).delete(userId);
        if (this.roomUsers.get(roomId).size === 0) {
          this.roomUsers.delete(roomId);
        }
      }
      
      // 通知聊天室中的其他用户
      socket.to(roomId).emit('user-left', {
        userId,
        username,
        timestamp: new Date()
      });
      
      // 发送系统消息
      const systemMessage = new ChatMessage({
        room: roomId,
        sender: userId,
        content: `${username} 离开了聊天室`,
        messageType: 'system'
      });
      await systemMessage.save();
      await systemMessage.populate('sender', 'username firstName lastName');
      
      this.io.to(roomId).emit('system-message', {
        message: systemMessage
      });
      
      console.log(`👋 用户 ${username} 离开聊天室 ${roomId}`);
      
    } catch (error) {
      console.error('离开聊天室错误:', error);
      socket.emit('error', { message: '离开聊天室失败' });
    }
  }

  async handleSendMessage(socket, data) {
    try {
      if (!socket.user) {
        socket.emit('error', { message: '请先进行身份验证' });
        return;
      }
      
      const { roomId, content, messageType = 'text' } = data;
      const { userId, username } = socket.user;
      
      if (!content || content.trim().length === 0) {
        socket.emit('error', { message: '消息内容不能为空' });
        return;
      }
      
      // 检查用户是否在聊天室中
      if (!this.roomUsers.has(roomId) || !this.roomUsers.get(roomId).has(userId)) {
        socket.emit('error', { message: '您不在此聊天室中' });
        return;
      }
      
      // 创建消息
      const message = new ChatMessage({
        room: roomId,
        sender: userId,
        content: content.trim(),
        messageType
      });
      
      await message.save();
      await message.populate('sender', 'username firstName lastName');
      
      // 更新聊天室的最后消息和时间
      await ChatRoom.findByIdAndUpdate(roomId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });
      
      // 广播消息给聊天室中的所有用户（包括发送者）
      this.io.to(roomId).emit('new-message', {
        message,
        roomId
      });
      
      console.log(`💬 用户 ${username} 在聊天室 ${roomId} 发送消息`);
      
    } catch (error) {
      console.error('发送消息错误:', error);
      socket.emit('error', { message: '发送消息失败' });
    }
  }

  async handleTyping(socket, data) {
    try {
      if (!socket.user) return;
      
      const { roomId, isTyping } = data;
      const { userId, username } = socket.user;
      
      // 检查用户是否在聊天室中
      if (!this.roomUsers.has(roomId) || !this.roomUsers.get(roomId).has(userId)) {
        return;
      }
      
      // 广播输入状态给聊天室中的其他用户
      socket.to(roomId).emit('user-typing', {
        userId,
        username,
        isTyping,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('处理输入状态错误:', error);
    }
  }

  handleDisconnect(socket) {
    console.log('👋 用户断开连接:', socket.id);
    
    if (socket.user) {
      const { userId, username } = socket.user;
      
      // 从所有房间中移除用户
      for (const [roomId, userSet] of this.roomUsers.entries()) {
        if (userSet.has(userId)) {
          userSet.delete(userId);
          
          // 通知房间中的其他用户
          this.io.to(roomId).emit('user-left', {
            userId,
            username,
            timestamp: new Date()
          });
          
          if (userSet.size === 0) {
            this.roomUsers.delete(roomId);
          }
        }
      }
      
      // 清理用户连接信息
      this.connectedUsers.delete(socket.id);
      this.userSockets.delete(userId);
    }
  }

  // 获取房间中的在线用户
  getRoomOnlineUsers(roomId) {
    if (!this.roomUsers.has(roomId)) return [];
    
    return Array.from(this.roomUsers.get(roomId))
      .map(userId => {
        const socketId = this.userSockets.get(userId);
        const userInfo = this.connectedUsers.get(socketId);
        return userInfo ? {
          userId,
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        } : null;
      })
      .filter(Boolean);
  }

  // 获取全局在线用户数
  getGlobalOnlineCount() {
    return this.connectedUsers.size;
  }
}

module.exports = ChatSocketService;