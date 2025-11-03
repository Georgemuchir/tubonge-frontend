import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, MessageCircle } from 'lucide-react';
import UserSearchModal from './UserSearchModal';

const ConversationList = () => {
  const { conversations, activeConversation, setActiveConversation } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

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
        <h1 className="nexus-app-title">Nexus Chat</h1>
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
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="nexus-conversations-list">
        {filteredConversations.length === 0 ? (
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
                    {conversation.lastMessage || conversation.last_message?.content || 'Say hello! 👋'}
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
          onSelectUser={(selectedUser) => {
            setShowUserSearch(false);
            // Logic to create/open conversation with selected user will be handled in the modal
          }}
        />
      )}
    </>
  );
};

export default ConversationList;