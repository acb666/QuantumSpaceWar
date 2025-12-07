// 前端集成示例 - React 组件
import React, { useState, useEffect } from 'react';
import { useAuth, useGuides, useChat } from './hooks';
import chatSocketService from './chatSocket';

// 认证组件示例
export const AuthExample = () => {
  const { user, loading, error, login, register, logout, isAuthenticated } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLoginMode) {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('密码不匹配');
          return;
        }
        await register(formData);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>加载中...</div>;

  if (isAuthenticated) {
    return (
      <div>
        <h3>欢迎, {user.username}!</h3>
        <p>邮箱: {user.email}</p>
        <button onClick={logout}>退出登录</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{isLoginMode ? '登录' : '注册'}</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {!isLoginMode && (
          <input
            type="text"
            placeholder="用户名"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        )}
        <input
          type="email"
          placeholder="邮箱"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="密码"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        {!isLoginMode && (
          <input
            type="password"
            placeholder="确认密码"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        )}
        <button type="submit">{isLoginMode ? '登录' : '注册'}</button>
        <button type="button" onClick={() => setIsLoginMode(!isLoginMode)}>
          {isLoginMode ? '切换到注册' : '切换到登录'}
        </button>
      </form>
    </div>
  );
};

// 攻略列表组件示例
export const GuideListExample = () => {
  const { guides, loading, error, createGuide, likeGuide } = useGuides();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGuide, setNewGuide] = useState({
    title: '',
    content: '',
    category: 'general',
    difficulty: 'beginner'
  });

  const handleCreateGuide = async (e) => {
    e.preventDefault();
    try {
      await createGuide(newGuide);
      setShowCreateForm(false);
      setNewGuide({ title: '', content: '', category: 'general', difficulty: 'beginner' });
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>加载攻略中...</div>;

  return (
    <div>
      <h2>攻略列表</h2>
      <button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? '取消' : '创建攻略'}
      </button>
      
      {showCreateForm && (
        <form onSubmit={handleCreateGuide}>
          <input
            type="text"
            placeholder="标题"
            value={newGuide.title}
            onChange={(e) => setNewGuide({...newGuide, title: e.target.value})}
            required
          />
          <textarea
            placeholder="内容"
            value={newGuide.content}
            onChange={(e) => setNewGuide({...newGuide, content: e.target.value})}
            required
          />
          <select
            value={newGuide.category}
            onChange={(e) => setNewGuide({...newGuide, category: e.target.value})}
          >
            <option value="general">综合</option>
            <option value="beginner">新手</option>
            <option value="advanced">高级</option>
            <option value="strategy">策略</option>
          </select>
          <select
            value={newGuide.difficulty}
            onChange={(e) => setNewGuide({...newGuide, difficulty: e.target.value})}
          >
            <option value="beginner">简单</option>
            <option value="intermediate">中等</option>
            <option value="advanced">困难</option>
          </select>
          <button type="submit">创建</button>
        </form>
      )}

      {error && <p style={{color: 'red'}}>{error}</p>}
      
      <div>
        {guides.map(guide => (
          <div key={guide._id} style={{border: '1px solid #ccc', margin: '10px 0', padding: '10px'}}>
            <h3>{guide.title}</h3>
            <p>{guide.content}</p>
            <small>作者: {guide.author.username} | 分类: {guide.category} | 难度: {guide.difficulty}</small>
            <div>
              <button onClick={() => likeGuide(guide._id)}>
                👍 {guide.likes}
              </button>
              <span>创建时间: {new Date(guide.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 聊天组件示例
export const ChatExample = () => {
  const {
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
    sendTypingStatus
  } = useChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoinRoom = async (roomId) => {
    try {
      await joinRoom(roomId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(currentRoom);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    
    // 发送输入状态
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    sendTypingStatus(true);
    
    const timeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  if (loading) return <div>加载聊天室中...</div>;

  return (
    <div style={{display: 'flex', height: '500px'}}>
      {/* 房间列表 */}
      <div style={{width: '200px', borderRight: '1px solid #ccc', padding: '10px'}}>
        <h3>聊天室</h3>
        <button onClick={fetchRooms}>刷新</button>
        {rooms.map(room => (
          <div key={room._id} style={{margin: '5px 0'}}>
            <button 
              onClick={() => handleJoinRoom(room._id)}
              disabled={currentRoom === room._id}
            >
              {room.name}
            </button>
            <small>({room.memberCount}人)</small>
          </div>
        ))}
      </div>

      {/* 聊天区域 */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        {currentRoom ? (
          <>
            <div style={{padding: '10px', borderBottom: '1px solid #ccc'}}>
              <button onClick={handleLeaveRoom}>离开房间</button>
              <span>在线用户: {onlineUsers.length}</span>
              {typingUsers.length > 0 && (
                <span style={{fontStyle: 'italic'}}>
                  {typingUsers.join(', ')} 正在输入...
                </span>
              )}
            </div>
            
            <div style={{flex: 1, overflowY: 'auto', padding: '10px'}}>
              {messages.map((message, index) => (
                <div key={index} style={{margin: '5px 0'}}>
                  <strong>{message.sender.username}:</strong> {message.content}
                  <small style={{marginLeft: '10px'}}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </small>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} style={{padding: '10px'}}>
              <input
                type="text"
                placeholder="输入消息..."
                value={messageInput}
                onChange={handleTyping}
                style={{width: '80%'}}
              />
              <button type="submit">发送</button>
            </form>
          </>
        ) : (
          <div style={{padding: '20px', textAlign: 'center'}}>
            请选择一个聊天室加入
          </div>
        )}
      </div>
      
      {error && <div style={{color: 'red', padding: '10px'}}>{error}</div>}
    </div>
  );
};

// 完整应用示例
export const AppExample = () => {
  const [activeTab, setActiveTab] = useState('auth');

  return (
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      <h1>量子太空杀 - Node.js 后端示例</h1>
      
      <div style={{marginBottom: '20px'}}>
        <button onClick={() => setActiveTab('auth')}>认证</button>
        <button onClick={() => setActiveTab('guides')}>攻略</button>
        <button onClick={() => setActiveTab('chat')}>聊天</button>
      </div>

      {activeTab === 'auth' && <AuthExample />}
      {activeTab === 'guides' && <GuideListExample />}
      {activeTab === 'chat' && <ChatExample />}
    </div>
  );
};

export default {
  AuthExample,
  GuideListExample,
  ChatExample,
  AppExample,
};