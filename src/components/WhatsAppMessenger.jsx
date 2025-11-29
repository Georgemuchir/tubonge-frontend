import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, Plus, Phone, Video, Info, Paperclip, Smile, Sparkles, Mail, Lock, User, Check, X, MoreVertical, Menu, ArrowLeft, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const styles = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  .blob {
    animation: blob 7s infinite;
  }
  
  .float-animation {
    animation: float 3s ease-in-out infinite;
  }
  
  .slide-up {
    animation: slideUp 0.4s ease-out;
  }
  
  .glass-card {
    background: linear-gradient(135deg, rgba(51, 65, 85, 0.8), rgba(30, 41, 59, 0.6));
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .glass-card:hover {
    background: linear-gradient(135deg, rgba(51, 65, 85, 0.9), rgba(30, 41, 59, 0.7));
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.2);
  }
  
  .message-sent {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }
  
  .message-received {
    background: #475569;
  }
  
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 16px 48px rgba(59, 130, 246, 0.3);
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #3b82f6;
    border-radius: 3px;
  }
  
  .whatsapp-bg {
    background-color: #1e293b;
  }
  
  .whatsapp-header {
    background-color: #334155;
  }
  
  .whatsapp-sidebar {
    background-color: #1e293b;
  }
  
  .whatsapp-chat-bg {
    background-color: #0f172a;
    background-image: 
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 35px,
        rgba(59, 130, 246, 0.03) 35px,
        rgba(59, 130, 246, 0.03) 70px
      );
  }
  
  .whatsapp-input {
    background-color: #475569;
  }
  
  .blue-accent {
    color: #3b82f6;
  }
  
  .blue-bg {
    background-color: #3b82f6;
  }
  
  .blue-bg-hover:hover {
    background-color: #2563eb;
  }
  
  .green-accent {
    color: #10b981;
  }
  
  .green-bg {
    background-color: #10b981;
  }
  
  .orange-accent {
    color: #f97316;
  }
  
  .orange-bg {
    background-color: #f97316;
  }
  
  .conversation-hover:hover {
    background-color: #334155;
  }
  
  .conversation-active {
    background-color: #475569;
  }
  
  .grey-bg {
    background-color: #64748b;
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .mobile-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 100%;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.3s ease-out;
    }
    
    .mobile-sidebar.active {
      transform: translateX(0);
    }
    
    .mobile-chat {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 40;
    }
    
    .touch-target {
      min-height: 48px;
      min-width: 48px;
    }
    
    .touch-target {
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    
    .safe-area-bottom {
      padding-bottom: max(1rem, env(safe-area-inset-bottom));
    }
  }
`;

const UserSearch = ({ onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers('');
  }, []);

  const loadUsers = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    loadUsers(query);
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="whatsapp-header rounded-2xl p-6 w-full max-w-md border border-gray-700" onClick={(e) => e.stopPropagation()} style={{animation: 'scaleUp 0.3s ease-out'}}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">New Chat</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 rounded-lg whatsapp-input text-white placeholder-gray-400 focus:outline-none border-none"
          />
        </div>
        
        <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            searchResults.map((user) => (
              <div 
                key={user.id || user._id} 
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-lg`}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ConversationsView = ({ conversations, onSelectUser, onNewMessage, onOpenSidebar, isMobile, getAvatarColor, searchQuery, setSearchQuery }) => {
  return (
    <div className="flex-1 flex flex-col whatsapp-bg border-l border-gray-800">
      {/* Header */}
      <div className="whatsapp-header p-5 flex items-center justify-between border-b border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onOpenSidebar}
              className="p-2 rounded-lg hover:bg-gray-700 text-white transition-all touch-target"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-teal-400" />
              Conversations
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{conversations.length} active chats</p>
          </div>
        </div>
        <button
          onClick={onNewMessage}
          className="p-3 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white transition-all shadow-lg hover:shadow-xl touch-target"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="whatsapp-header p-4 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-12 pr-4 py-3 rounded-xl whatsapp-input text-white text-sm placeholder-gray-400 focus:outline-none border border-gray-700 focus:border-teal-500 transition-colors touch-target"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{background: 'linear-gradient(to bottom, #1e293b, #0f172a)'}}>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 slide-up">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl"></div>
              <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 shadow-2xl">
                <MessageCircle className="w-16 h-16 text-gray-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              No conversations yet
            </h3>
            <p className="text-gray-400 mb-8 max-w-md text-lg leading-relaxed">
              Start messaging by clicking the + button to find and connect with people
            </p>
            <button
              onClick={onNewMessage}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Start New Chat
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {conversations.map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => onSelectUser(conv)}
                className="p-4 cursor-pointer transition-all border-b border-gray-700/50 hover:bg-gray-800/50 slide-up"
                style={{animationDelay: `${index * 0.02}s`}}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar Section */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full ${conv.color} flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-gray-700/50`}>
                      {conv.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 green-bg rounded-full border-3 border-gray-900 shadow-lg animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {conv.name}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium ml-2 flex-shrink-0">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-400 text-sm truncate flex-1">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      {conv.unread > 0 && (
                        <span className="flex-shrink-0 px-2 py-1 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-bold shadow-lg">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WhatsAppMessenger = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutbox, setShowOutbox] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const typingTimeoutRef = useRef(null);

  // Fetch inbox on mount
  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/inbox`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInbox(data.inbox || []);
        setTotalUnread(data.total_unread || 0);
        
        const onlineStatusMap = {};
        data.inbox?.forEach(item => {
          onlineStatusMap[item.sender_id] = item.online || false;
        });
        setOnlineUsers(onlineStatusMap);
      }
    } catch (error) {
      console.error('Fetch inbox error:', error);
    }
  };

  // Socket.IO listeners
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.sender_id;
      const receiverId = newMessage.receiver_id;
      const selectedId = selectedUser && (selectedUser.id || selectedUser._id);

      // Show message if it's part of the current chat (sender or receiver)
      if (selectedUser && (senderId === selectedId || receiverId === selectedId)) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
      fetchInbox();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New message from Pinglo', {
          body: newMessage.content.substring(0, 50),
          icon: '/favicon.ico'
        });
      }
    };

    const handleUserStatus = (statusData) => {
      setOnlineUsers(prev => ({
        ...prev,
        [statusData.user_id]: statusData.status === 'online'
      }));
      
      if (selectedUser && (selectedUser.id === statusData.user_id || selectedUser._id === statusData.user_id)) {
        setSelectedUser(prev => ({
          ...prev,
          online: statusData.status === 'online'
        }));
      }
    };

    const handleUserTyping = (data) => {
      const senderId = data.user_id || data.sender_id;
      const isTyping = data.is_typing || false;
      if (!senderId) return;
      setTypingUsers(prev => ({ ...prev, [senderId]: !!isTyping }));
      
      if (selectedUser && (selectedUser.id === senderId || selectedUser._id === senderId)) {
        setSelectedUser(prev => ({ ...prev, isTyping: !!isTyping }));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('inbox_update', fetchInbox);
    socket.on('user_status', handleUserStatus);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('inbox_update', fetchInbox);
      socket.off('user_status', handleUserStatus);
      socket.off('user_typing', handleUserTyping);
    };
  }, [selectedUser]);

  // Handle window resize
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    }
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    setShowMobileSidebar(false);
    
    const userId = user.id || user._id;
    
    try {
      await fetch(`${API_BASE_URL}/messages/mark-read/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      fetchInbox();
    } catch (error) {
      console.error('Mark read error:', error);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedUser) return;
    
    try {
      const socket = socketService.socket;
      if (socket && selectedUser) {
        const recipientId = selectedUser.id || selectedUser._id;
        socket.emit('typing_user', {
          recipient_id: recipientId,
          sender_id: user?.id || user?._id,
          is_typing: false
        });
      }
    } catch (err) {}
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          recipient_id: selectedUser.id || selectedUser._id,
          content: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setMessage('');
      }
    } catch (error) {
      console.error('Send error:', error);
    }
  };

  const filteredConversations = inbox
    .filter(conv => 
      conv.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.sender_username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(conv => ({
      id: conv.sender_id,
      _id: conv.sender_id,
      name: conv.sender_name,
      username: conv.sender_username,
      lastMessage: conv.last_message,
      time: formatTime(conv.last_message_time),
      unread: conv.unread_count,
      online: onlineUsers[conv.sender_id] || false,
      color: getAvatarColor(conv.sender_name)
    }));

  return (
    <div className="h-screen whatsapp-bg flex overflow-hidden">
      <style>{styles}</style>
      
      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      
      {/* Minimal Sidebar */}
      <div className={`
        ${isMobile ? 'mobile-sidebar' : 'w-20'} 
        ${isMobile && showMobileSidebar ? 'active' : ''}
        whatsapp-sidebar border-r border-gray-800 flex flex-col items-center py-6
        ${isMobile ? 'max-w-[85%]' : ''}
      `}>
        {/* User Profile */}
        <div className="mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-teal-400/30 cursor-pointer hover:scale-110 transition-transform">
            {user?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
          {totalUnread > 0 && (
            <div className="mt-2 px-2 py-1 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-bold text-center shadow-lg animate-pulse">
              {totalUnread}
            </div>
          )}
        </div>
        
        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col gap-4 items-center">
          <button
            onClick={() => setShowUserSearch(true)}
            className="p-4 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-teal-400 transition-all touch-target group relative"
            title="New Chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              New Chat
            </span>
          </button>
          
          <button
            className="p-4 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-blue-400 transition-all touch-target group relative"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
            <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Settings
            </span>
          </button>
        </div>
        
        {/* Logout at Bottom */}
        <button
          onClick={handleLogout}
          className="p-4 rounded-xl hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-all touch-target group relative"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-3 py-1 bg-red-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Logout
          </span>
        </button>
      </div>
      
      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${isMobile && selectedUser ? 'mobile-chat' : ''}`}>
        {!selectedUser ? (
          <ConversationsView 
            conversations={filteredConversations}
            onSelectUser={handleUserSelect}
            onNewMessage={() => setShowUserSearch(true)} 
            onOpenSidebar={() => setShowMobileSidebar(true)}
            isMobile={isMobile}
            getAvatarColor={getAvatarColor}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        ) : (
          <>
          {/* Chat Header */}
          <div className="whatsapp-header p-3 flex items-center justify-between border-l border-gray-800">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {isMobile && (
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedUser.name)} flex items-center justify-center text-white font-semibold`}>
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {(onlineUsers[selectedUser.id] || onlineUsers[selectedUser._id] || selectedUser.online) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 green-bg rounded-full border-2 border-gray-900 animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{selectedUser.name}</p>
                <p className="text-xs">
                  {(selectedUser?.isTyping || typingUsers[(selectedUser?.id || selectedUser?._id)]) ? (
                    <span className="italic text-sm green-accent">typing...</span>
                  ) : (
                    (onlineUsers[selectedUser?.id] || onlineUsers[selectedUser?._id] || selectedUser?.online) ? (
                      <span className="green-accent">online</span>
                    ) : <span className="text-gray-400">offline</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 whatsapp-chat-bg scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No messages yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSent = msg.sender_id === user?.id || msg.sender_id === user?._id;
                return (
                  <div key={msg.id || msg._id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`} style={{animation: 'fadeIn 0.3s ease-out'}}>
                    <div className={`max-w-[85%] md:max-w-md ${isSent ? 'message-sent' : 'message-received'} rounded-lg px-3 py-2 md:px-4 md:py-2 shadow-md`}>
                      <p className="text-white text-sm leading-relaxed break-words">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-gray-300">{formatTime(msg.timestamp || msg.created_at)}</span>
                        {isSent && (
                          <Check className="w-4 h-4 text-blue-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="whatsapp-header p-3 flex items-center gap-2 border-l border-gray-800 safe-area-bottom">
            <button className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
              <Smile className="w-6 h-6" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
              <Paperclip className="w-6 h-6" />
            </button>
            <div className="flex-1 whatsapp-input rounded-lg px-3 py-2 md:px-4 md:py-2">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  try {
                    const socket = socketService.socket;
                    if (socket && selectedUser) {
                      const recipientId = selectedUser.id || selectedUser._id;
                      socket.emit('typing_user', {
                        recipient_id: recipientId,
                        sender_id: user?.id || user?._id,
                        is_typing: true
                      });
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        try {
                          socket.emit('typing_user', {
                            recipient_id: recipientId,
                            sender_id: user?.id || user?._id,
                            is_typing: false
                          });
                        } catch (err) {}
                      }, 1500);
                    }
                  } catch (err) {}
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message"
                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-sm md:text-base"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 rounded-full blue-bg blue-bg-hover text-white transition-colors touch-target disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          </>
        )}
      </div>
      
      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onSelectUser={handleUserSelect}
        />
      )}
    </div>
  );
};

export default WhatsAppMessenger;
