import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = () => {
  const { 
    activeConversation, 
    messages, 
    messagesLoading, 
    sendMessage, 
    sendTyping,
    typingUsers,
    setActiveConversation 
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle back navigation
  const handleBack = () => {
    setActiveConversation(null);
  };

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
    <>
      {/* Chat Header */}
      <div className="nexus-chat-header">
        {/* Back button for mobile */}
        <button 
          onClick={handleBack}
          className="nexus-back-btn md:hidden"
          title="Back to conversations"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="nexus-chat-user-info">
          <div className="nexus-chat-avatar">
            {otherParticipant.avatar ? (
              <img 
                src={otherParticipant.avatar} 
                alt={otherParticipant.name}
                className="w-full h-full rounded-[14px] object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="nexus-chat-details">
            <div className="nexus-chat-name">
              {otherParticipant.name || 'Unknown User'}
            </div>
            <div className="nexus-chat-status">
              {otherParticipant.status === 'online' ? 'Active now' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="nexus-chat-actions">
          <button className="nexus-action-btn">📞</button>
          <button className="nexus-action-btn">📹</button>
          <button className="nexus-action-btn">ℹ️</button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="nexus-messages-container">
        {messagesLoading ? (
          <div className="nexus-empty-state">
            <div className="nexus-empty-icon">⏳</div>
            <div className="nexus-empty-text">Loading messages...</div>
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

      {/* Input Area */}
      <div className="nexus-input-area">
        <div className="nexus-input-actions">
          <button className="nexus-input-btn">📎</button>
        </div>
        <div className="nexus-message-input-wrapper">
          <input
            type="text"
            value={messageText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="nexus-message-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
          className="nexus-send-btn"
        >
          ➤
        </button>
      </div>
    </>
  );
};

export default ChatWindow;