// 前端集成示例 - 使用说明和最佳实践

/**
 * 量子太空杀 - Node.js 后端前端集成示例
 * 
 * 这个文件包含了如何在前端项目中集成 Node.js 后端的完整示例
 * 包括 React Hooks、组件、配置等
 */

/* ==================== 快速开始 ==================== */

// 1. 安装依赖
// npm install axios socket.io-client

// 2. 复制前端服务文件到你的 React 项目中
// 复制 frontend-services 文件夹到你的 src 目录

// 3. 在你的 React 应用中导入和使用
import React from 'react';
import { AuthExample, GuideListExample, ChatExample, AppExample } from './frontend-services/components';

function App() {
  return <AppExample />;
}

export default App;

/* ==================== 详细集成步骤 ==================== */

// 步骤 1: 环境变量配置
// 在你的项目根目录创建 .env 文件
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_ENV=development

// 步骤 2: 安装必要的依赖
npm install axios socket.io-client

// 步骤 3: 复制文件结构
src/
├── frontend-services/
│   ├── api.js          # API 服务
│   ├── chatSocket.js   # Socket 服务
│   ├── hooks.js        # React Hooks
│   ├── components.js   # React 组件
│   └── config.js       # 配置文件

// 步骤 4: 在你的应用中使用
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthExample, GuideListExample, ChatExample } from './frontend-services/components';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthExample />} />
        <Route path="/guides" element={<GuideListExample />} />
        <Route path="/chat" element={<ChatExample />} />
      </Routes>
    </Router>
  );
}

/* ==================== 自定义配置 ==================== */

// 修改配置文件 config.js
const CUSTOM_CONFIG = {
  ...CONFIG,
  API_BASE_URL: 'https://your-api-domain.com/api',
  SOCKET_URL: 'https://your-api-domain.com',
  FEATURES: {
    CHAT_ENABLED: true,
    GUIDES_ENABLED: true,
    USER_STATS_ENABLED: false, // 禁用用户统计
  },
  CHAT: {
    MAX_MESSAGE_LENGTH: 500, // 自定义消息长度限制
    TYPING_TIMEOUT: 2000,    // 自定义输入超时时间
  },
};

// 在 API 服务中使用自定义配置
import axios from 'axios';
import CUSTOM_CONFIG from './config';

const apiClient = axios.create({
  baseURL: CUSTOM_CONFIG.API_BASE_URL,
  timeout: CUSTOM_CONFIG.REQUEST.TIMEOUT,
});

/* ==================== 错误处理 ==================== */

// 全局错误处理
import { message } from 'antd'; // 假设你使用 antd

// 在 API 服务中添加错误处理
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 未授权，跳转到登录页
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      message.error('服务器错误，请稍后重试');
    } else {
      message.error(error.message || '请求失败');
    }
    return Promise.reject(error);
  }
);

/* ==================== 性能优化 ==================== */

// 1. 使用 React.memo 优化组件
import React from 'react';

const OptimizedGuideList = React.memo(({ guides }) => {
  return (
    <div>
      {guides.map(guide => (
        <GuideItem key={guide._id} guide={guide} />
      ))}
    </div>
  );
});

// 2. 使用 useMemo 和 useCallback 优化 Hooks
export const useOptimizedGuides = (filters) => {
  const { guides, loading, fetchGuides } = useGuides(filters);
  
  const filteredGuides = React.useMemo(() => {
    return guides.filter(guide => guide.likes > 10);
  }, [guides]);
  
  const handleRefresh = React.useCallback(() => {
    fetchGuides(filters);
  }, [filters, fetchGuides]);
  
  return { guides: filteredGuides, loading, handleRefresh };
};

// 3. 虚拟滚动处理大量消息
import { VariableSizeList as List } from 'react-window';

const VirtualizedChatMessages = ({ messages }) => {
  const rowRenderer = ({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={messages.length}
      itemSize={() => 50}
      width="100%"
    >
      {rowRenderer}
    </List>
  );
};

/* ==================== 安全考虑 ==================== */

// 1. 输入验证
const validateMessage = (content) => {
  if (!content || content.trim().length === 0) {
    throw new Error('消息不能为空');
  }
  if (content.length > CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
    throw new Error(`消息长度不能超过 ${CONFIG.CHAT.MAX_MESSAGE_LENGTH} 字符`);
  }
  // XSS 防护
  return content.replace(/<script[^>]*>.*?<\/script>/gi, '');
};

// 2. 敏感信息处理
const sanitizeUserData = (user) => {
  const { password, __v, ...safeUser } = user;
  return safeUser;
};

// 3. 安全的 Socket 连接
const secureSocketConnection = () => {
  const token = localStorage.getItem(CONFIG.STORAGE.TOKEN_KEY);
  if (!token) {
    console.warn('未找到认证令牌');
    return;
  }
  
  chatSocketService.connect(token);
};

/* ==================== 测试示例 ==================== */

// 单元测试示例 (使用 Jest)
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './hooks';

jest.mock('./api', () => ({
  authAPI: {
    login: jest.fn().mockResolvedValue({ success: true, data: { user: { id: 1, name: 'Test' } } }),
    logout: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(true),
    getCurrentUser: jest.fn().mockResolvedValue({ success: true, data: { user: { id: 1, name: 'Test' } } })
  }
}));

describe('useAuth Hook', () => {
  test('should handle login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password' });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 1, name: 'Test' });
  });
});

/* ==================== 部署注意事项 ==================== */

// 1. 环境变量设置
// 生产环境 .env.production
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_SOCKET_URL=https://api.your-domain.com
REACT_APP_ENV=production

// 2. 构建优化
// package.json scripts
"scripts": {
  "build": "react-scripts build",
  "build:analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
  "serve": "serve -s build -l 3000"
}

// 3. CORS 配置
// 确保后端 CORS 配置允许你的前端域名
// 在 server.js 中配置：
// origin: process.env.FRONTEND_URL?.split(',') || ["https://your-frontend-domain.com"]

/* ==================== 故障排除 ==================== */

// 常见问题：
// 1. Socket 连接失败
// - 检查后端 Socket.IO 是否正确配置
// - 确认前端 Socket URL 设置正确
// - 检查防火墙和网络设置

// 2. 认证失败
// - 确认 JWT 密钥一致
// - 检查 Token 存储和传递
// - 验证用户模型和数据库连接

// 3. 跨域问题
// - 检查后端 CORS 配置
// - 确认环境变量设置正确
// - 验证请求头是否包含必要信息

// 4. 性能问题
// - 使用 React DevTools 分析组件渲染
// - 检查 Socket 事件监听器是否正确清理
// - 优化大量数据的渲染方式

export default {
  // 导出所有配置和工具
  CONFIG,
  // 可以在这里添加更多工具函数
};