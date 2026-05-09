import { useState, useEffect, useRef } from 'react';
import { messagesAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Phone, Video, MoreVertical, ArrowLeft, ImageIcon, Mic, Square, X, Reply } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { AlertTriangle } from 'lucide-react';

const formatLastSeen = (ts) => {
  if (!ts) return 'Offline';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return 'Offline';
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays} days ago`;
  return `Last seen ${date.toLocaleDateString()}`;
};

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
    getRelationshipStatus,
    acceptMessageRequest,
    declineMessageRequest,
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [relationshipStatus, setRelationshipStatus] = useState('NONE');
  const [statusLoading, setStatusLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Reply state
  const [replyToMessage, setReplyToMessage] = useState(null);
  const inputRef = useRef(null);

  // Handle back navigation
  const handleBack = () => {
    setActiveConversation(null);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      sendTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

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
      sendMessage(
        messageText,
        'text',
        replyToMessage?.id || null,
        replyToMessage?.content || null,
        replyToMessage?.senderName || null
      );
      setMessageText('');
      setIsTyping(false);
      setReplyToMessage(null);
      if (relationshipStatus === 'NONE') {
        setRelationshipStatus('OUTGOING_PENDING');
      }
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
        sendMessage(res.data.url, 'image', replyToMessage?.id || null, replyToMessage?.content || null, replyToMessage?.senderName || null);
        setReplyToMessage(null);
      }
    } catch {
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Voice recording
  const startRecording = async () => {
    if (relationshipStatus !== 'ACCEPTED' && relationshipStatus !== 'NONE') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await uploadVoiceNote(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Override onstop so it doesn't upload
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
  };

  const uploadVoiceNote = async (blob) => {
    setUploadingVoice(true);
    try {
      const res = await messagesAPI.uploadVoice(blob);
      if (res.data && res.data.url) {
        sendMessage(res.data.url, 'voice', replyToMessage?.id || null, replyToMessage?.content || null, replyToMessage?.senderName || null);
        setReplyToMessage(null);
      }
    } catch {
      alert('Failed to send voice note.');
    } finally {
      setUploadingVoice(false);
    }
  };

  const fmtRecording = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false);
    }
  };

  const handleReply = (message) => {
    // Determine sender display name
    const senderName = message.sender_id === (user?._id || user?.id)
      ? 'You'
      : getOtherParticipant()?.name || 'Unknown';
    setReplyToMessage({ ...message, senderName });
    inputRef.current?.focus();
  };

  const getOtherParticipant = () => {
    if (activeConversation?.otherParticipant) {
      return activeConversation.otherParticipant;
    }
    return activeConversation?.participants?.find(p => p.id !== user?.id) || {};
  };

  const otherParticipant = getOtherParticipant();

    // Check relationship status on conversation change
    useEffect(() => {
      const checkStatus = async () => {
        if (otherParticipant?.id) {
          setStatusLoading(true);
          const data = await getRelationshipStatus(otherParticipant.id);
          setRelationshipStatus(data.status || 'NONE');
          setRequestId(data.request_id || null);
          setStatusLoading(false);
        } else {
          setRelationshipStatus('NONE');
          setRequestId(null);
        }
      };
      checkStatus();
    }, [activeConversation?.id, otherParticipant?.id]);

  // Get typing users for this conversation (excluding current user)
  const conversationTypingUsers = typingUsers[activeConversation?.id] || {};
  const isOtherUserTyping = Object.entries(conversationTypingUsers)
    .some(([userId, typing]) => userId !== user?.id && typing);

  const handleAcceptRequest = async () => {
    if (!requestId) return;
    await acceptMessageRequest(requestId);
    setRelationshipStatus('ACCEPTED');
  };

  const handleDeclineRequest = async () => {
    if (!requestId) return;
    await declineMessageRequest(requestId);
    setActiveConversation(null);
  };

  if (!activeConversation) {
    return null;
  }

  const canChat = relationshipStatus === 'ACCEPTED' || relationshipStatus === 'NONE';

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
              {otherParticipant.status === 'online' ? 'Active now' : (user?.show_last_seen !== false ? formatLastSeen(otherParticipant.last_seen) : 'Offline')}
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
                    onReply={canChat ? handleReply : null}
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

      {/* Input area */}
      {statusLoading ? (
        <div className="flex items-center justify-center py-6 text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
          Checking permission…
        </div>
      ) : (
        <>
          {!canChat && (
            <div className="flex flex-col items-center justify-center py-3 text-yellow-400">
              <AlertTriangle className="mb-2" size={24} />
              {relationshipStatus === 'OUTGOING_PENDING' && (
                <>
                  <div className="font-semibold text-sm">Message request sent</div>
                  <div className="text-xs mt-1 text-gray-400">Waiting for {otherParticipant?.name} to accept before you can send more.</div>
                </>
              )}
              {relationshipStatus === 'INCOMING_PENDING' && (
                <>
                  <div className="font-semibold text-sm mb-2">Message request from {otherParticipant?.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest()}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-full font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest()}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full font-semibold"
                    >
                      Decline
                    </button>
                  </div>
                </>
              )}
              {relationshipStatus === 'NONE' && (
                <>
                  <div className="font-semibold text-sm">Send a message to connect</div>
                  <div className="text-xs mt-1 text-gray-400">Your first message will be sent as a request.</div>
                </>
              )}
            </div>
          )}

          {/* Reply preview */}
          {replyToMessage && canChat && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(16,185,129,0.08)',
              borderLeft: '3px solid #10b981',
              margin: '0 0 0 0',
            }}>
              <Reply className="size-4 text-emerald-400 flex-shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginBottom: 2 }}>
                  Replying to {replyToMessage.senderName}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {replyToMessage.message_type === 'voice' ? '🎤 Voice note' :
                   replyToMessage.message_type === 'image' ? '🖼 Image' :
                   replyToMessage.content}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                aria-label="Cancel reply"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <form
            className="nexus-input-modern"
            onSubmit={handleSendMessage}
          >
            <div className="nexus-input-container-modern">
              {/* Image upload button */}
              <button
                type="button"
                className="nexus-attachment-btn cursor-pointer hover:bg-blue-700 focus:bg-blue-800 focus:outline-none"
                aria-label="Attach image"
                onClick={() => {
                  if (!canChat) return;
                  if (imageInputRef.current) imageInputRef.current.click();
                }}
                disabled={uploadingImage || uploadingVoice || isRecording || !canChat}
                tabIndex={0}
                style={{ border: 'none', background: 'transparent', padding: 0, marginRight: 8 }}
                title={!canChat ? 'You must be friends to send images' : 'Attach image'}
              >
                <ImageIcon className="size-5 text-white/80" />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
                disabled={uploadingImage || !canChat}
              />
              {(uploadingImage || uploadingVoice) && (
                <span className="text-xs text-gray-400 ml-2">Uploading...</span>
              )}

              {/* Recording indicator or text input */}
              {isRecording ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#f87171',
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  Recording {fmtRecording(recordingSeconds)}
                </div>
              ) : (
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={!canChat ? 'You must be friends to chat' : replyToMessage ? 'Write a reply…' : 'Type a message…'}
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
                  disabled={!canChat}
                  style={!canChat ? { background: '#222', color: '#aaa', cursor: 'not-allowed' } : {}}
                  title={!canChat ? 'You must be friends to chat' : ''}
                />
              )}

              {/* Voice button: cancel if recording, start/stop otherwise */}
              {isRecording ? (
                <>
                  <button
                    type="button"
                    className="nexus-voice-btn"
                    aria-label="Cancel recording"
                    onClick={cancelRecording}
                    title="Cancel recording"
                    style={{ color: '#9ca3af' }}
                  >
                    <X className="size-5" />
                  </button>
                  <button
                    type="button"
                    className="nexus-voice-btn"
                    aria-label="Stop and send voice note"
                    onClick={stopRecording}
                    title="Send voice note"
                    style={{ color: '#10b981' }}
                  >
                    <Square className="size-5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="nexus-voice-btn"
                  aria-label="Record voice message"
                  onClick={startRecording}
                  disabled={!canChat || uploadingVoice || uploadingImage}
                  title={!canChat ? 'You must be friends to send voice messages' : 'Hold to record voice note'}
                >
                  <Mic className="size-5 text-white/80" />
                </button>
              )}

              {!isRecording && (
                <button
                  type="submit"
                  disabled={!messageText.trim() || !canChat}
                  className="nexus-send-modern-btn"
                  title={!canChat ? 'You must be friends to send messages' : ''}
                >
                  <Send className="size-4" />
                  Send
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
