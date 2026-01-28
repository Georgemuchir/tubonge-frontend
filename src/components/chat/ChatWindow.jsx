import { useState, useEffect, useRef } from 'react';
import { messagesAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Phone, Video, MoreVertical, ArrowLeft, ImageIcon, Mic } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { AlertTriangle } from 'lucide-react';

const ChatWindow = () => {
  const imageInputRef = useRef(null);
  const { 
    activeConversation, 
    messages, 
    messagesLoading, 
    sendMessage, 
    sendTyping,
    typingUsers,
    setActiveConversation,
    getRelationshipStatus
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [relationshipStatus, setRelationshipStatus] = useState('NONE');
  const [statusLoading, setStatusLoading] = useState(false);

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

  // Handle image file selection and upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await messagesAPI.uploadImage(file);
      if (res.data && res.data.url) {
        // Send image message (sendMessage can be extended to support type)
        sendMessage(res.data.url, 'image');
      }
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
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

    // Check relationship status on conversation change
    useEffect(() => {
      const checkStatus = async () => {
        if (otherParticipant?.username) {
          setStatusLoading(true);
          const status = await getRelationshipStatus(otherParticipant.username);
          setRelationshipStatus(status);
          setStatusLoading(false);
        } else {
          setRelationshipStatus('NONE');
        }
      };
      checkStatus();
    }, [activeConversation?.id, otherParticipant?.username]);

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
        {statusLoading ? (
          <div className="flex items-center justify-center py-6 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
            Checking permission…
          </div>
        ) : (
          <>
            {relationshipStatus !== 'ACCEPTED' && (
              <div className="flex flex-col items-center justify-center py-2 text-yellow-400">
                <AlertTriangle className="mb-2" size={24} />
                <div className="font-semibold text-sm">You can't send messages yet</div>
                {relationshipStatus === 'OUTGOING_PENDING' && (
                  <div className="text-xs mt-1">Friend request sent. Waiting for acceptance.</div>
                )}
                {relationshipStatus === 'INCOMING_PENDING' && (
                  <div className="text-xs mt-1">You have a friend request from this user. <b>Accept it in your inbox to start chatting.</b></div>
                )}
                {relationshipStatus === 'NONE' && (
                  <div className="text-xs mt-1">Send a friend request to start chatting.</div>
                )}
                {relationshipStatus === 'BLOCKED' && (
                  <div className="text-xs mt-1">You have blocked this user.</div>
                )}
              </div>
            )}
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
                  className="nexus-attachment-btn cursor-pointer hover:bg-blue-700 focus:bg-blue-800 focus:outline-none"
                  aria-label="Attach image"
                  onClick={() => {
                    console.log('Image upload button clicked', relationshipStatus);
                    if (relationshipStatus !== 'ACCEPTED') return;
                    if (imageInputRef.current) imageInputRef.current.click();
                  }}
                  disabled={uploadingImage || relationshipStatus !== 'ACCEPTED'}
                  tabIndex={0}
                  style={{ border: 'none', background: 'transparent', padding: 0, marginRight: 8 }}
                  title={relationshipStatus !== 'ACCEPTED' ? 'You must be friends to send images' : 'Attach image'}
                >
                  <ImageIcon className="size-5 text-white/80" />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    console.log('File input onChange', e.target.files);
                    handleImageChange(e);
                  }}
                  disabled={uploadingImage || relationshipStatus !== 'ACCEPTED'}
                />
                {uploadingImage && (
                  <span className="text-xs text-gray-400 ml-2">Uploading...</span>
                )}

                <textarea
                  rows={1}
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={relationshipStatus !== 'ACCEPTED' ? 'You must be friends to chat' : 'Type a message…'}
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
                  disabled={relationshipStatus !== 'ACCEPTED'}
                  style={relationshipStatus !== 'ACCEPTED' ? { background: '#222', color: '#aaa', cursor: 'not-allowed' } : {}}
                  title={relationshipStatus !== 'ACCEPTED' ? 'You must be friends to chat' : ''}
                />

                <button 
                  type="button" 
                  className="nexus-voice-btn" 
                  aria-label="Voice message"
                  disabled={relationshipStatus !== 'ACCEPTED'}
                  title={relationshipStatus !== 'ACCEPTED' ? 'You must be friends to send voice messages' : ''}
                >
                  <Mic className="size-5 text-white/80" />
                </button>

                <button
                  type="submit"
                  disabled={!messageText.trim() || relationshipStatus !== 'ACCEPTED'}
                  className="nexus-send-modern-btn"
                  title={relationshipStatus !== 'ACCEPTED' ? 'You must be friends to send messages' : ''}
                >
                  <Send className="size-4" />
                  Send
                </button>
              </div>
            </form>
          </>
        )}
    </div>
  );
};

export default ChatWindow;