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

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
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
    return conversation.participants?.find(p => p.id !== user?.id) || {};
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowUserSearch(true)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            title="Start new conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const isActive = activeConversation?.id === conversation.id;
            
            return (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation)}
                className={`flex items-center p-4 cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-blue-50 border-r-2 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {otherParticipant.avatar ? (
                      <img 
                        src={otherParticipant.avatar} 
                        alt={otherParticipant.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {otherParticipant.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {otherParticipant.name || 'Unknown User'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.last_message?.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message?.content || 'No messages yet'}
                    </p>
                    
                    {conversation.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
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
    </div>
  );
};

export default ConversationList;