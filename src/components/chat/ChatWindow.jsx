import { useState, useEffect, useRef } from 'react';
import { messagesAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Phone, Video, MoreVertical, ArrowLeft, ImageIcon, Mic, Square, X, Reply, Clock, CheckCircle, UserCheck, UserX } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import socketService from '../../services/socket';

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
    loadMessages,
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [chatStatus, setChatStatus] = useState('NONE');
  const [statusLoading, setStatusLoading] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [incomingRequest, setIncomingRequest] = useState(null); // { requestId, text, senderName }

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !inputEnabled) return;
    const text = messageText;
    setMessageText('');
    setIsTyping(false);
    setReplyToMessage(null);
    const result = await sendMessage(text, 'text', replyToMessage?.id || null, replyToMessage?.content || null, replyToMessage?.senderName || null);
    if (result?.pending) {
      setChatStatus('OUTGOING_PENDING');
      setPendingText(text);
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
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Voice recording
  const startRecording = async () => {
    if (relationshipStatus !== 'ACCEPTED') return;
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

    // Check chat status on conversation change
  useEffect(() => {
    const checkStatus = async () => {
      const otherId = otherParticipant?.id;
      if (!otherId) { setChatStatus('NONE'); return; }
      setStatusLoading(true);
      try {
        const res = await messagesAPI.getChatStatus(otherId);
        const data = res.data;
        setChatStatus(data.status);
        if (data.status === 'OUTGOING_PENDING') setPendingText(data.text || '');
        if (data.status === 'INCOMING_PENDING') {
          setIncomingRequest({ requestId: data.request_id, text: data.text || '', senderName: otherParticipant?.name || '' });
        }
      } catch {
        setChatStatus('NONE');
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [activeConversation?.id, otherParticipant?.id]);

  // Listen for incoming message requests and acceptances in real time
  useEffect(() => {
    const handleIncomingRequest = (data) => {
      if (data.sender_id === otherParticipant?.id) {
        setIncomingRequest({ requestId: data.request_id, text: data.text || '', senderName: otherParticipant?.name || '' });
        setChatStatus('INCOMING_PENDING');
      }
    };
    const handleRequestAccepted = async (data) => {
      setChatStatus('ACCEPTED');
      setPendingText('');
      if (activeConversation?.id) await loadMessages(activeConversation.id);
    };
    socketService.onMessageRequest(handleIncomingRequest);
    socketService.onRequestAccepted(handleRequestAccepted);
    return () => {
      socketService.off('message_request', handleIncomingRequest);
      socketService.off('request_accepted', handleRequestAccepted);
    };
  }, [activeConversation?.id, otherParticipant?.id]);

  // Get typing users for this conversation (excluding current user)
  const conversationTypingUsers = typingUsers[activeConversation?.id] || {};
  const isOtherUserTyping = Object.entries(conversationTypingUsers)
    .some(([userId, typing]) => userId !== user?.id && typing);

  if (!activeConversation) {
    return null;
  }

  const canChat = chatStatus === 'ACCEPTED';
  const canSendInitial = chatStatus === 'NONE';
  const inputEnabled = canChat || canSendInitial;

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
                messages.filter(Boolean).map((message, index, arr) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_id === user?.id}
                    showAvatar={
                      index === 0 ||
                      arr[index - 1].sender_id !== message.sender_id
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
          {chatStatus === 'OUTGOING_PENDING' && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {pendingText && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <div style={{
                    maxWidth: '70%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    borderRadius: '18px 18px 4px 18px', padding: '10px 14px',
                    color: '#fff', fontSize: 14, opacity: 0.75, position: 'relative',
                  }}>
                    {pendingText}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.6)', justifyContent: 'flex-end' }}>
                      <Clock size={10} /> Pending
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 14,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} color="#818cf8" />
                </div>
                <div>
                  <div style={{ color: '#c7d2fe', fontWeight: 600, fontSize: 14 }}>Message request sent</div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                    Waiting for {otherParticipant?.name || 'them'} to accept before you can continue chatting
                  </div>
                </div>
              </div>
            </div>
          )}

          {chatStatus === 'INCOMING_PENDING' && incomingRequest && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  maxWidth: '70%', background: 'rgba(255,255,255,0.06)',
                  borderRadius: '18px 18px 18px 4px', padding: '10px 14px',
                  color: '#e5e7eb', fontSize: 14, border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {incomingRequest.text}
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    {incomingRequest.senderName} wants to connect
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={async () => {
                    try {
                      await messagesAPI.acceptMessageRequest(incomingRequest.requestId);
                      setChatStatus('ACCEPTED');
                      setIncomingRequest(null);
                      if (activeConversation?.id) loadMessages(activeConversation.id);
                    } catch { alert('Failed to accept request.'); }
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                    fontWeight: 600, fontSize: 14,
                  }}
                >
                  <UserCheck size={16} /> Accept
                </button>
                <button
                  onClick={async () => {
                    try {
                      await messagesAPI.declineMessageRequest(incomingRequest.requestId);
                      setChatStatus('NONE');
                      setIncomingRequest(null);
                    } catch { alert('Failed to decline request.'); }
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)',
                    cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#f87171',
                    fontWeight: 600, fontSize: 14,
                  }}
                >
                  <UserX size={16} /> Decline
                </button>
              </div>
            </div>
          )}

          {/* Reply preview and input — hidden when a request is pending on either side */}
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

          {(chatStatus === 'OUTGOING_PENDING' || chatStatus === 'INCOMING_PENDING') ? null : <form
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
                title={!canChat ? 'Accept the request first to send images' : 'Attach image'}
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
                  placeholder={
                    canSendInitial ? 'Send a message request…' :
                    canChat ? (replyToMessage ? 'Write a reply…' : 'Type a message…') :
                    'You cannot send messages here'
                  }
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
                  disabled={!inputEnabled}
                  style={!inputEnabled ? { background: '#222', color: '#aaa', cursor: 'not-allowed' } : {}}
                  title={!inputEnabled ? 'You cannot send messages here' : ''}
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
                  title={!canChat ? 'Accept the request first to send voice messages' : 'Hold to record voice note'}
                >
                  <Mic className="size-5 text-white/80" />
                </button>
              )}

              {!isRecording && (
                <button
                  type="submit"
                  disabled={!messageText.trim() || !inputEnabled}
                  className="nexus-send-modern-btn"
                  title={canSendInitial ? 'Send message request' : !canChat ? 'Not available' : ''}
                >
                  <Send className="size-4" />
                  Send
                </button>
              )}
            </div>
          </form>}
        </>
      )}
    </div>
  );
};

export default ChatWindow;
