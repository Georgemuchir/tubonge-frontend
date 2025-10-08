import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Phone, Video, MoreVertical } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = () => {
  const { 
    activeConversation, 
    messages, 
    messagesLoading, 
    sendMessage, 
    sendTyping,
    typingUsers 
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      sendTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 3000);
    } else {
      sendTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, sendTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false);
    }
  };

  const getOtherParticipant = () => {
    return activeConversation?.participants?.find(p => p.id !== user?.id) || {};
  };

  const otherParticipant = getOtherParticipant();

  // Get typing users for this conversation (excluding current user)
  const conversationTypingUsers = typingUsers[activeConversation?.id] || {};
  const isOtherUserTyping = Object.entries(conversationTypingUsers)
    .some(([userId, typing]) => userId !== user?.id && typing);

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {otherParticipant.avatar ? (
                <img 
                  src={otherParticipant.avatar} 
                  alt={otherParticipant.name}
                  className="w-10 h-10 rounded-full object-cover"
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

          {/* Name and Status */}
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">
              {otherParticipant.name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-500">
              {otherParticipant.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === user?.id}
                showAvatar={
                  index === 0 || 
                  messages[index - 1].sender_id !== message.sender_id
                }
                otherParticipant={otherParticipant}
              />
            ))}
            
            {/* Typing Indicator */}
            {isOtherUserTyping && (
              <TypingIndicator user={otherParticipant} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;