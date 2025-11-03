import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Phone, Video, MoreVertical, ArrowLeft, ImageIcon, Mic } from 'lucide-react';
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
    // Handle new persistent format with otherParticipant field
    if (activeConversation?.otherParticipant) {
      return activeConversation.otherParticipant;
    }
    // Fallback to old format
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
    <div 
      className="nexus-chat-frame"
      style={{
        '--bg': '#0a0f1a',
        '--headerGlass': 'rgba(255,255,255,0.05)',
        '--bubbleMe': '#1e293b',
        '--bubbleOther': '#0b1220',
        '--accent': '#10b981',
        '--frameFrom': '#0c1324',
        '--frameTo': '#0a0f1a',
      }}
    >
      {/* Glass header */}
      <header className="nexus-modern-header">
        <button
          aria-label="Back"
          className="nexus-back-modern-btn md:hidden"
          onClick={handleBack}
          title="Back to conversations"
        >
          <ArrowLeft className="size-5 text-white/90" />
        </button>
        
        <div className="nexus-user-info-modern">
          <div className="nexus-avatar-modern">
            {otherParticipant.avatar ? (
              <img 
                src={otherParticipant.avatar} 
                alt={otherParticipant.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="nexus-details-modern">
            <div className="nexus-name-modern">
              {otherParticipant.name || 'Unknown User'}
            </div>
            <div className="nexus-status-modern">
              {otherParticipant.status === 'online' ? 'Active now' : 'Offline'}
            </div>
          </div>
        </div>
        
        <div className="nexus-actions-modern">
          <button className="nexus-action-modern-btn" aria-label="Audio call">
            <Phone className="size-5"/>
          </button>
          <button className="nexus-action-modern-btn" aria-label="Video call">
            <Video className="size-5"/>
          </button>
          <button className="nexus-action-modern-btn" aria-label="More">
            <MoreVertical className="size-5"/>
          </button>
        </div>
      </header>

      {/* Scrollable chat area */}
      <main className="nexus-messages-modern">
        <div className="nexus-messages-content">
          {messagesLoading ? (
            <div className="nexus-loading-state">
              <div className="nexus-loading-icon">⏳</div>
              <div className="nexus-loading-text">Loading messages...</div>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="nexus-empty-chat">
                  <div className="nexus-empty-icon">💬</div>
                  <div className="nexus-empty-title">No messages yet</div>
                  <div className="nexus-empty-subtitle">Start the conversation!</div>
                </div>
              ) : (
                messages.map((message, index) => (
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
                ))
              )}
              
              {/* Typing Indicator */}
              {isOtherUserTyping && (
                <TypingIndicator user={otherParticipant} />
              )}
            </>
          )}
        </div>
        <div ref={messagesEndRef} />
      </main>

      {/* Modern Input bar */}
      <form
        className="nexus-input-modern"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(e);
        }}
      >
        <div className="nexus-input-container-modern">
          <button 
            type="button" 
            className="nexus-attachment-btn" 
            aria-label="Attach image"
          >
            <ImageIcon className="size-5 text-white/80" />
          </button>
          
          <textarea
            rows={1}
            value={messageText}
            onChange={handleInputChange}
            placeholder="Type a message…"
            className="nexus-textarea-modern"
            onInput={(e) => {
              const ta = e.currentTarget;
              ta.style.height = "auto";
              ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          
          <button 
            type="button" 
            className="nexus-voice-btn" 
            aria-label="Voice message"
          >
            <Mic className="size-5 text-white/80" />
          </button>
          
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="nexus-send-modern-btn"
          >
            <Send className="size-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;