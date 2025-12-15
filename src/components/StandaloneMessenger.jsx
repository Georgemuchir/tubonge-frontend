import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, Plus, Phone, Video, Info, Paperclip, Smile, Sparkles, Mail, Lock, User, Check, X, Menu, ArrowLeft, MoreVertical } from 'lucide-react';
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
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .blob {
    animation: blob 7s infinite;
  }
  
  .float-animation {
    animation: float 3s ease-in-out infinite;
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .message-sent {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
  }
  
  .message-received {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
  }
  
  .hover-lift {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 3px;
  }
  
  .slide-in-left {
    animation: slideInLeft 0.3s ease-out;
  }
  
  .slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
  
  /* Safe area for mobile devices with notches */
  .safe-area-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
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
    
    /* Larger touch targets for mobile */
    .touch-target {
      min-height: 48px;
      min-width: 48px;
    }
    
    /* Prevent text selection on double-tap */
    .touch-target {
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
  }
`;

const UserSearch = ({ onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all users when component mounts
  React.useEffect(() => {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()} style={{animation: 'scaleUp 0.3s ease-out'}}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Find Users</h3>
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
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No users found</p>
              {searchQuery && <p className="text-gray-500 text-sm mt-2">Try a different search</p>}
            </div>
          ) : (
            searchResults.map((user) => (
              <div key={user.id || user._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover-lift"
                >
                  Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyChat = ({ onNewMessage, onOpenSidebar, isMobile }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
      {isMobile && (
        <button
          onClick={onOpenSidebar}
          className="absolute top-4 left-4 p-3 rounded-lg glass-card text-white hover:bg-white/10 transition-colors touch-target"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4 md:mb-6 float-animation">
          <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-purple-400" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No conversation selected</h3>
        <p className="text-gray-400 text-sm md:text-base mb-6 md:mb-8 px-4">
          {isMobile ? 'Tap the menu to view your conversations' : 'Choose a conversation or start a new one'}
        </p>
        <div className="flex gap-3 justify-center px-4">
          <button
            onClick={onNewMessage}
            className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm md:text-base font-semibold hover-lift touch-target"
          >
            Start a conversation
          </button>
        </div>
      </div>
    </div>
  );
};

const StandaloneMessenger = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({}); // Track unread messages per user
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [inbox, setInbox] = useState([]); // Inbox data
  const [totalUnread, setTotalUnread] = useState(0); // Total unread count
  const [onlineUsers, setOnlineUsers] = useState({}); // Track online status per user
  const [typingUsers, setTypingUsers] = useState({}); // Track who is typing
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
        
        // Update unread messages state
        const unreadMap = {};
        const onlineStatusMap = {};
        data.inbox?.forEach(item => {
          if (item.unread_count > 0) {
            unreadMap[item.sender_id] = item.unread_count;
          }
          // Initialize online status
          onlineStatusMap[item.sender_id] = item.online || false;
        });
        setUnreadMessages(unreadMap);
        setOnlineUsers(onlineStatusMap);
      }
    } catch (error) {
      console.error('Fetch inbox error:', error);
    }
  };

  // Listen for incoming messages via Socket.IO
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      console.log('Received new message:', newMessage);
      
      const senderId = newMessage.sender_id;
      
      // If viewing this user's chat, add message immediately
      if (selectedUser && senderId === (selectedUser.id || selectedUser._id)) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else {
        // Message from someone else - increment unread count
        setUnreadMessages(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New message from Pinglo', {
            body: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
            icon: '/favicon.ico'
          });
        }
      }
      
      // Refresh inbox
      fetchInbox();
    };

    const handleInboxUpdate = () => {
      fetchInbox();
    };

    const handleUserTyping = (data) => {
      // data: { user_id, is_typing } or { conversation_id, user_id, is_typing }
      const senderId = data.user_id || data.sender_id;
      const isTyping = data.is_typing || data.isTyping || false;
      if (!senderId) return;
      setTypingUsers(prev => ({ ...prev, [senderId]: !!isTyping }));
      // If the typing event is for selected user, optionally update header via selectedUser state
      if (selectedUser && (selectedUser.id === senderId || selectedUser._id === senderId)) {
        setSelectedUser(prev => ({ ...prev, isTyping: !!isTyping }));
      }
    };

    const handleUserStatus = (statusData) => {
      console.log('User status update:', statusData);
      
      setOnlineUsers(prev => ({
        ...prev,
        [statusData.user_id]: statusData.status === 'online'
      }));
      
      // Update selected user's online status if applicable
      if (selectedUser && (selectedUser.id === statusData.user_id || selectedUser._id === statusData.user_id)) {
        setSelectedUser(prev => ({
          ...prev,
          online: statusData.status === 'online'
        }));
      }
      
      // Update inbox to reflect online status
      setInbox(prev => prev.map(item => 
        item.sender_id === statusData.user_id 
          ? { ...item, online: statusData.status === 'online' }
          : item
      ));
    };

  socket.on('new_message', handleNewMessage);
  socket.on('inbox_update', handleInboxUpdate);
  socket.on('user_status', handleUserStatus);
  socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('inbox_update', handleInboxUpdate);
      socket.off('user_status', handleUserStatus);
      socket.off('user_typing', handleUserTyping);
    };
  }, [selectedUser]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Handle window resize for responsive design
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

  const handleSend = async () => {
    if (!message.trim() || !selectedUser) return;
    
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

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    setShowMobileSidebar(false); // Close sidebar on mobile when user is selected
    
    // Clear unread count for this user
    const userId = user.id || user._id;
    setUnreadMessages(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
    
    // Mark messages as read
    try {
      await fetch(`${API_BASE_URL}/messages/mark-read/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // Refresh inbox after marking as read
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Sort inbox by last_message_time descending, then filter and map
  const filteredConversations = inbox
    .slice() // copy to avoid mutating state
    .sort((a, b) => {
      const timeA = new Date(a.last_message_time).getTime();
      const timeB = new Date(b.last_message_time).getTime();
      return timeB - timeA;
    })
    .filter(conv => 
      conv.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.sender_username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(conv => ({
      id: conv.sender_id,
      _id: conv.sender_id,
      name: conv.sender_name,
      username: conv.sender_username,
      email: conv.sender_email,
      avatar: conv.sender_avatar,
      lastMessage: conv.last_message,
      time: formatTime(conv.last_message_time),
      unread: conv.unread_count,
      online: onlineUsers[conv.sender_id] || false // Real-time online status
    }));

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex overflow-hidden">
      <style>{styles}</style>
      
      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'mobile-sidebar' : 'w-80'} 
        ${isMobile && showMobileSidebar ? 'active' : ''}
        glass-card border-r border-white/10 flex flex-col
        ${isMobile ? 'max-w-[85%] sm:max-w-sm' : ''}
      `}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Pinglo
              </h1>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors touch-target"
            >
              Logout
            </button>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors touch-target"
            />
          </div>
          
          <button
            onClick={() => setShowUserSearch(true)}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover-lift flex items-center justify-center gap-2 touch-target"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm">No conversations yet</p>
              <p className="text-gray-500 text-xs mt-2">Click "New Chat" to start</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleUserSelect(conv)}
                className={`p-4 md:p-3 border-b border-white/5 cursor-pointer transition-colors touch-target active:bg-white/20 ${
                  selectedUser?.id === conv.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg md:text-base">
                      {conv.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-semibold truncate text-base md:text-sm">{conv.name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-400 text-sm truncate flex-1">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold min-w-[24px] text-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      {!selectedUser ? (
        <EmptyChat onNewMessage={() => setShowUserSearch(true)} onOpenSidebar={() => setShowMobileSidebar(true)} isMobile={isMobile} />
      ) : (
        <div className={`flex-1 flex flex-col ${isMobile ? 'mobile-chat' : ''}`}>
          {/* Chat Header */}
          <div className="glass-card border-b border-white/10 p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {isMobile && (
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors touch-target flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {(onlineUsers[selectedUser.id] || onlineUsers[selectedUser._id] || selectedUser.online) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-base md:text-base">{selectedUser.name}</p>
                <p className="text-gray-400 text-xs md:text-sm">
                  {(selectedUser?.isTyping || typingUsers[(selectedUser?.id || selectedUser?._id)]) ? (
                    <span className="italic text-sm">typing...</span>
                  ) : (
                    (onlineUsers[selectedUser?.id] || onlineUsers[selectedUser?._id] || selectedUser?.online) ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    ) : 'Offline'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors touch-target">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
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
                gunicorn -
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                c gunicorn.conf.py wsgi:app                gunicorn -
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                c gunicorn.conf.py wsgi:app                gunicorn -
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                c gunicorn.conf.py wsgi:app                gunicorn -
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                c gunicorn.conf.py wsgi:app                const isSent = msg.sender_id === user?.id || msg.sender_id === user?._id;
                return (
                  <div key={msg.id || msg._id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`} style={{animation: 'fadeIn 0.3s ease-out'}}>
                    <div className={`max-w-[85%] md:max-w-md ${isSent ? 'message-sent' : 'message-received'} rounded-2xl px-3 py-2 md:px-4 md:py-2`}>
                      <p className="text-white text-sm md:text-base break-words">{msg.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-white/60">{formatTime(msg.timestamp || msg.created_at)}</span>
                        {isSent && (
                          <Check className={`w-3 h-3 ${msg.read ? 'text-blue-400' : 'text-white/60'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Message Input */}
          <div className="glass-card border-t border-white/10 p-3 md:p-4 safe-area-bottom">
            <div className="flex items-end gap-2">
              <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
                <Paperclip className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
                <Smile className="w-5 h-5" />
              </button>
              <textarea
                value={message}
                onChange={(e) => {
                  // Update local value
                  setMessage(e.target.value);
                  try {
                    const socket = socketService.socket;
                    if (socket && selectedUser) {
                      const recipientId = selectedUser.id || selectedUser._id;
                      // Emit typing_user to recipient
                      socket.emit('typing_user', {
                        recipient_id: recipientId,
                        sender_id: user?.id || user?._id,
                        is_typing: true
                      });
                      // Reset previous timeout
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      // After 1.5s of inactivity, emit typing false
                      typingTimeoutRef.current = setTimeout(() => {
                        try {
                          socket.emit('typing_user', {
                            recipient_id: recipientId,
                            sender_id: user?.id || user?._id,
                            is_typing: false
                          });
                        } catch (err) {
                          // ignore
                        }
                      }, 1500);
                    }
                  } catch (err) {
                    // ignore socket errors
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
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
                  }
                }}
                placeholder="Type a message..."
                rows="1"
                className="flex-1 px-3 py-2.5 md:px-4 md:py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none touch-target"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="p-3 md:p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover-lift touch-target disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onSelectUser={handleUserSelect}
        />
      )}
    </div>
  );
};

export default StandaloneMessenger;
