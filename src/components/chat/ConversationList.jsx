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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">{user?.name || 'Messages'}</h1>
        </div>
        <button 
          onClick={() => setShowUserSearch(true)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="New message"
        >
          <Plus className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:bg-gray-200 transition-all"
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
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-gray-100' 
                    : 'hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 rounded-full flex items-center justify-center ring-2 ring-gray-200">
                    {otherParticipant.avatar ? (
                      <img 
                        src={otherParticipant.avatar} 
                        alt={otherParticipant.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {otherParticipant.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm">
                        {otherParticipant.name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.last_message?.content || 'Say hello! 👋'}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end ml-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(conversation.last_message?.timestamp)}
                      </span>
                      {conversation.unread_count > 0 && (
                        <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </div>
                      )}
                    </div>
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