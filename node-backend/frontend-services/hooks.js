// 前端集成示例 - React Hook
import { useState, useEffect, useCallback } from 'react';
import { authAPI, guideAPI, chatAPI } from './api';
import chatSocketService from './chatSocket';

// 认证 Hook
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const response = await authAPI.getCurrentUser();
        if (response.success) {
          setUser(response.data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      if (response.success) {
        setUser(response.data.user);
        // 连接 Socket
        await chatSocketService.connect();
        return response;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser(response.data.user);
        // 连接 Socket
        await chatSocketService.connect();
        return response;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    authAPI.logout();
    chatSocketService.disconnect();
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};

// 攻略 Hook
export const useGuides = (filters = {}) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchGuides = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await guideAPI.getGuides({ ...filters, ...params });
      if (response.success) {
        setGuides(response.data.guides);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const createGuide = async (guideData) => {
    try {
      const response = await guideAPI.createGuide(guideData);
      if (response.success) {
        // 刷新列表
        await fetchGuides();
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const likeGuide = async (guideId) => {
    try {
      const response = await guideAPI.likeGuide(guideId);
      if (response.success) {
        // 更新本地状态
        setGuides(prev => prev.map(guide => 
          guide._id === guideId 
            ? { ...guide, likes: response.data.likes }
            : guide
        ));
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    guides,
    loading,
    error,
    pagination,
    fetchGuides,
    createGuide,
    likeGuide,
  };
};

// 聊天 Hook
export const useChat = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 设置 Socket 事件监听器
    setupSocketListeners();
    
    return () => {
      // 清理事件监听器
      cleanupSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    chatSocketService.on('new-message', handleNewMessage);
    chatSocketService.on('user-joined', handleUserJoined);
    chatSocketService.on('user-left', handleUserLeft);
    chatSocketService.on('user-typing', handleUserTyping);
    chatSocketService.on('room-users', handleRoomUsers);
    chatSocketService.on('system-message', handleSystemMessage);
  };

  const cleanupSocketListeners = () => {
    chatSocketService.off('new-message', handleNewMessage);
    chatSocketService.off('user-joined', handleUserJoined);
    chatSocketService.off('user-left', handleUserLeft);
    chatSocketService.off('user-typing', handleUserTyping);
    chatSocketService.off('room-users', handleRoomUsers);
    chatSocketService.off('system-message', handleSystemMessage);
  };

  const handleNewMessage = (data) => {
    setMessages(prev => [...prev, data.message]);
  };

  const handleUserJoined = (data) => {
    console.log('用户加入:', data);
  };

  const handleUserLeft = (data) => {
    console.log('用户离开:', data);
  };

  const handleUserTyping = (data) => {
    if (data.isTyping) {
      setTypingUsers(prev => [...prev, data.username]);
    } else {
      setTypingUsers(prev => prev.filter(name => name !== data.username));
    }
  };

  const handleRoomUsers = (data) => {
    setOnlineUsers(data.users);
  };

  const handleSystemMessage = (data) => {
    setMessages(prev => [...prev, data.message]);
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMyRooms();
      if (response.success) {
        setRooms(response.data.rooms);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      // 先通过 API 加入房间
      const response = await chatAPI.joinRoom(roomId);
      if (response.success) {
        // 然后通过 Socket 加入
        chatSocketService.joinRoom(roomId);
        setCurrentRoom(roomId);
        
        // 获取房间消息
        const messagesResponse = await chatAPI.getMessages(roomId);
        if (messagesResponse.success) {
          setMessages(messagesResponse.data.messages);
        }
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const leaveRoom = async (roomId) => {
    try {
      chatSocketService.leaveRoom(roomId);
      await chatAPI.leaveRoom(roomId);
      
      if (currentRoom === roomId) {
        setCurrentRoom(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const sendMessage = (content, messageType = 'text') => {
    if (!currentRoom) {
      setError('未加入任何聊天室');
      return;
    }

    chatSocketService.sendMessage(currentRoom, content, messageType);
  };

  const sendTypingStatus = (isTyping) => {
    if (!currentRoom) return;

    chatSocketService.sendTypingStatus(currentRoom, isTyping);
  };

  return {
    rooms,
    currentRoom,
    messages,
    onlineUsers,
    typingUsers,
    loading,
    error,
    fetchRooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTypingStatus,
  };
};

export default {
  useAuth,
  useGuides,
  useChat,
};