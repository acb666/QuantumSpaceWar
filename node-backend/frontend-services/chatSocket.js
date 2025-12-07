import { io } from 'socket.io-client';
import { authAPI } from './api';

// Socket.IO 服务配置
const SOCKET_CONFIG = {
  url: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  options: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.eventHandlers = new Map();
    this.reconnectTimer = null;
  }

  // 连接到 Socket.IO 服务器
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket 已连接');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);

        // 连接成功
        this.socket.on('connect', () => {
          console.log('✅ Socket.IO 连接成功');
          this.isConnected = true;
          
          // 如果有认证令牌，自动进行认证
          const token = authAPI.getToken();
          if (token) {
            this.authenticate(token);
          }
          
          resolve();
        });

        // 连接断开
        this.socket.on('disconnect', (reason) => {
          console.log('❌ Socket.IO 断开连接:', reason);
          this.isConnected = false;
          this.isAuthenticated = false;
          
          // 触发断开连接事件
          this.triggerEvent('disconnect', { reason });
          
          // 自动重连逻辑
          if (reason === 'io server disconnect') {
            // 服务器主动断开，需要手动重连
            this.socket.connect();
          }
        });

        // 连接错误
        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO 连接错误:', error);
          this.isConnected = false;
          reject(error);
        });

        // 认证成功
        this.socket.on('authenticated', (data) => {
          console.log('✅ Socket 认证成功');
          this.isAuthenticated = true;
          this.triggerEvent('authenticated', data);
        });

        // 认证失败
        this.socket.on('auth-error', (error) => {
          console.error('❌ Socket 认证失败:', error);
          this.isAuthenticated = false;
          this.triggerEvent('auth-error', error);
        });

        // 新消息
        this.socket.on('new-message', (data) => {
          this.triggerEvent('new-message', data);
        });

        // 系统消息
        this.socket.on('system-message', (data) => {
          this.triggerEvent('system-message', data);
        });

        // 用户加入
        this.socket.on('user-joined', (data) => {
          this.triggerEvent('user-joined', data);
        });

        // 用户离开
        this.socket.on('user-left', (data) => {
          this.triggerEvent('user-left', data);
        });

        // 用户输入状态
        this.socket.on('user-typing', (data) => {
          this.triggerEvent('user-typing', data);
        });

        // 房间用户列表
        this.socket.on('room-users', (data) => {
          this.triggerEvent('room-users', data);
        });

        // 错误处理
        this.socket.on('error', (error) => {
          console.error('Socket 错误:', error);
          this.triggerEvent('error', error);
        });

      } catch (error) {
        console.error('创建 Socket 连接失败:', error);
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
    }
  }

  // 认证
  authenticate(token) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket 未连接，无法认证');
      return;
    }

    this.socket.emit('authenticate', { token });
  }

  // 加入聊天室
  joinRoom(roomId) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket 未连接');
      return;
    }

    if (!this.isAuthenticated) {
      console.error('用户未认证');
      return;
    }

    this.socket.emit('join-room', { roomId });
  }

  // 离开聊天室
  leaveRoom(roomId) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket 未连接');
      return;
    }

    this.socket.emit('leave-room', { roomId });
  }

  // 发送消息
  sendMessage(roomId, content, messageType = 'text') {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket 未连接');
      return;
    }

    if (!this.isAuthenticated) {
      console.error('用户未认证');
      return;
    }

    this.socket.emit('send-message', {
      roomId,
      content,
      messageType,
      timestamp: new Date(),
    });
  }

  // 发送输入状态
  sendTypingStatus(roomId, isTyping) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    if (!this.isAuthenticated) {
      return;
    }

    this.socket.emit('typing', {
      roomId,
      isTyping,
      timestamp: new Date(),
    });
  }

  // 注册事件监听器
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  // 移除事件监听器
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // 触发事件
  triggerEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`事件处理器错误 (${event}):`, error);
        }
      });
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      socketId: this.socket?.id,
    };
  }

  // 重新连接
  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected) {
        console.log('🔄 尝试重新连接...');
        this.disconnect();
        this.connect().catch(error => {
          console.error('重新连接失败:', error);
        });
      }
    }, 3000);
  }
}

// 创建单例实例
const chatSocketService = new ChatSocketService();

export default chatSocketService;