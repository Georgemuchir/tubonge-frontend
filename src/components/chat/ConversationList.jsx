import { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, MessageCircle } from 'lucide-react';
import UserSearchModal from './UserSearchModal';
import { messageRequestsAPI } from '../../services/api';

const ConversationList = () => {
  const { conversations, activeConversation, setActiveConversation, acceptMessageRequest, declineMessageRequest } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [messageRequests, setMessageRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await messageRequestsAPI.getRequests();
        setMessageRequests(response.data.requests || []);
      } catch {
        setMessageRequests([]);
      }
    };
    loadRequests();
  }, []);

  const handleAccept = async (requestId) => {
    await acceptMessageRequest(requestId);
    setMessageRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleDecline = async (requestId) => {
    await declineMessageRequest(requestId);
    setMessageRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const filteredConversations = conversations.filter(conversation => {
    // Apply search filter
    if (searchTerm) {
      const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
      if (!otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    
    // Apply tab filter
    if (activeFilter === 'unread') {
      return (conversation.unreadCount || conversation.unread_count) > 0;
    }
    
    return true; // 'all' filter
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation) => {
    // Handle new persistent format with otherParticipant field
    if (conversation.otherParticipant) {
      return conversation.otherParticipant;
    }
    // Fallback to old format
    return conversation.participants?.find(p => p.id !== user?.id) || {};
  };

  return (
    <>
      {/* Sidebar Header */}
      <div className="nexus-sidebar-header">
        <h1 className="nexus-app-title">{user?.username ? `@${user.username}` : user?.name || 'Nexus Chat'}</h1>
        <div className="nexus-search-bar">
          <span className="nexus-search-icon">🔍</span>
          <input 
            type="text" 
            className="nexus-search-input" 
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
          <button 
            onClick={() => setShowUserSearch(true)}
            className="nexus-new-chat-btn"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          
          <div className="nexus-chat-filters">
            <div
              className={`nexus-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Chats
            </div>
            <div
              className={`nexus-filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread
            </div>
            <div
              className={`nexus-filter-tab ${activeFilter === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveFilter('requests')}
              style={{ position: 'relative' }}
            >
              Requests
              {messageRequests.length > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', fontSize: 10,
                  minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {messageRequests.length > 9 ? '9+' : messageRequests.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="nexus-conversations-list">
        {activeFilter === 'requests' ? (
          messageRequests.length === 0 ? (
            <div className="nexus-empty-state">
              <div className="nexus-empty-icon">📬</div>
              <div className="nexus-empty-text">No pending message requests</div>
            </div>
          ) : (
            messageRequests.map((req) => (
              <div key={req.id} className="nexus-conversation-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <div className="nexus-conversation-avatar">
                    {req.sender_avatar ? (
                      <img src={req.sender_avatar} alt={req.sender_name} className="w-full h-full rounded-[16px] object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {req.sender_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="nexus-conversation-info">
                    <div className="nexus-conversation-name">{req.sender_name}</div>
                    <div className="nexus-conversation-preview">@{req.sender_username}</div>
                  </div>
                </div>
                {req.text && (
                  <div style={{ fontSize: 12, color: '#9ca3af', paddingLeft: 50 }}>{req.text}</div>
                )}
                <div style={{ display: 'flex', gap: 8, paddingLeft: 50 }}>
                  <button
                    onClick={() => handleAccept(req.id)}
                    style={{ padding: '4px 14px', background: '#16a34a', color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    style={{ padding: '4px 14px', background: '#dc2626', color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )
        ) : filteredConversations.length === 0 ? (
          <div className="nexus-empty-state">
            <div className="nexus-empty-icon">💬</div>
            <div className="nexus-empty-text">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const isActive = activeConversation?.id === conversation.id;
            
            return (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation)}
                className={`nexus-conversation-item ${isActive ? 'active' : ''} ${
                  (conversation.unreadCount || conversation.unread_count) > 0 ? 'unread' : ''
                }`}
              >
                {/* Avatar */}
                <div className="nexus-conversation-avatar">
                  {otherParticipant.avatar ? (
                    <img 
                      src={otherParticipant.avatar} 
                      alt={otherParticipant.name}
                      className="w-full h-full rounded-[16px] object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-lg">
                      {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                  <span className={`nexus-status-dot ${otherParticipant.status || 'offline'}`}></span>
                </div>

                {/* Conversation Info */}
                <div className="nexus-conversation-info">
                  <div className="nexus-conversation-name">
                    {otherParticipant.name || 'Unknown User'}
                  </div>
                  <div className="nexus-conversation-preview">
                    {(() => {
                      const type = conversation.last_message?.message_type || conversation.lastMessageType;
                      const content = conversation.lastMessage || conversation.last_message?.content || '';
                      if (type === 'image' || content.startsWith?.('/api/messages/image/')) return '📷 Photo';
                      if (type === 'voice' || content.startsWith?.('/api/messages/voice/')) return '🎤 Voice note';
                      if (type === 'missed_call') return '📵 Missed call';
                      return content || 'Say hello! 👋';
                    })()}
                  </div>
                </div>
                
                {/* Meta */}
                <div className="nexus-conversation-meta">
                  <div className="nexus-conversation-time">
                    {formatTime(conversation.lastMessageTime || conversation.last_message?.timestamp)}
                  </div>
                  {(conversation.unreadCount || conversation.unread_count) > 0 && (
                    <div className="nexus-unread-count">
                      {(conversation.unreadCount || conversation.unread_count) > 9 ? '9+' : (conversation.unreadCount || conversation.unread_count)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearchModal
          onClose={() => setShowUserSearch(false)}
          onSelectUser={(_selectedUser) => {
            setShowUserSearch(false);
          }}
        />
      )}
    </>
  );
};

export default ConversationList;