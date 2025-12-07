// Node.js API 服务配置
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 获取存储的认证令牌
const getAuthToken = () => {
  return localStorage.getItem('nodeAuthToken');
};

// 设置认证令牌
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('nodeAuthToken', token);
  } else {
    localStorage.removeItem('nodeAuthToken');
  }
};

// API 请求封装
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
  }

  // 基础请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = getAuthToken();
    
    const config = {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: '请求失败' }));
        throw new Error(error.message || '请求失败');
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  // GET 请求
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST 请求
  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT 请求
  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE 请求
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 创建 API 服务实例
const apiService = new ApiService();

// 认证相关 API
export const authAPI = {
  // 用户注册
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  // 用户登录
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    return await apiService.get('/auth/me');
  },

  // 更新用户资料
  updateProfile: async (userData) => {
    return await apiService.put('/auth/profile', userData);
  },

  // 登出
  logout: () => {
    setAuthToken(null);
  },

  // 检查是否已登录
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // 获取认证令牌
  getToken: getAuthToken,
};

// 攻略相关 API
export const guideAPI = {
  // 获取攻略列表
  getGuides: async (params = {}) => {
    return await apiService.get('/guides', params);
  },

  // 获取攻略详情
  getGuide: async (id) => {
    return await apiService.get(`/guides/${id}`);
  },

  // 创建攻略
  createGuide: async (guideData) => {
    return await apiService.post('/guides', guideData);
  },

  // 更新攻略
  updateGuide: async (id, guideData) => {
    return await apiService.put(`/guides/${id}`, guideData);
  },

  // 删除攻略
  deleteGuide: async (id) => {
    return await apiService.delete(`/guides/${id}`);
  },

  // 点赞攻略
  likeGuide: async (id) => {
    return await apiService.post(`/guides/${id}/like`);
  },

  // 添加评论
  addComment: async (id, commentData) => {
    return await apiService.post(`/guides/${id}/comments`, commentData);
  },
};

// 聊天相关 API
export const chatAPI = {
  // 获取聊天室列表
  getRooms: async () => {
    return await apiService.get('/chat/rooms');
  },

  // 创建聊天室
  createRoom: async (roomData) => {
    return await apiService.post('/chat/rooms', roomData);
  },

  // 获取聊天室消息
  getMessages: async (roomId, params = {}) => {
    return await apiService.get(`/chat/rooms/${roomId}/messages`, params);
  },

  // 发送消息
  sendMessage: async (roomId, messageData) => {
    return await apiService.post(`/chat/rooms/${roomId}/messages`, messageData);
  },

  // 加入聊天室
  joinRoom: async (roomId) => {
    return await apiService.post(`/chat/rooms/${roomId}/join`);
  },

  // 离开聊天室
  leaveRoom: async (roomId) => {
    return await apiService.post(`/chat/rooms/${roomId}/leave`);
  },

  // 获取用户的聊天室
  getMyRooms: async () => {
    return await apiService.get('/chat/my-rooms');
  },
};

// 健康检查 API
export const healthAPI = {
  checkHealth: async () => {
    return await apiService.get('/health');
  },
};

export default apiService;