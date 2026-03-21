import { useState } from 'react';
import { Reply } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

// Strip /api suffix to get the base server URL for media files
const SERVER_URL = API_BASE_URL.replace(/\/api$/, '');

const MessageBubble = ({ message, isOwnMessage, showAvatar, otherParticipant, onReply }) => {
  const [hovered, setHovered] = useState(false);

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Build a usable absolute URL for media (voice/image) content
  const mediaUrl = (content) => {
    if (!content) return '';
    if (content.startsWith('http://') || content.startsWith('https://')) return content;
    // e.g. "/api/messages/voice/abc.webm" → "http://localhost:5000/api/messages/voice/abc.webm"
    return `${SERVER_URL}${content}`;
  };

  const isImage = message.message_type === 'image' ||
    (typeof message.content === 'string' && message.content.startsWith('/api/messages/image/'));
  const isVoice = message.message_type === 'voice' ||
    (typeof message.content === 'string' && message.content.startsWith('/api/messages/voice/'));
  const hasReply = !!message.reply_to_id;

  return (
    <div
      className={`nexus-message-modern ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Reply button — shown on hover, on the opposite side of the bubble */}
      {onReply && hovered && (
        <button
          type="button"
          onClick={() => onReply(message)}
          aria-label="Reply"
          style={{
            order: isOwnMessage ? -1 : 1,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9ca3af',
            flexShrink: 0,
            alignSelf: 'center',
            margin: '0 4px',
          }}
        >
          <Reply className="size-4" />
        </button>
      )}

      <div className={`nexus-bubble-modern ${isOwnMessage ? 'bubble-me' : 'bubble-other'}`}>
        {/* Quoted message (reply preview inside the bubble) */}
        {hasReply && (
          <div style={{
            borderLeft: '3px solid rgba(16,185,129,0.6)',
            paddingLeft: 8,
            marginBottom: 6,
            opacity: 0.8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', marginBottom: 2 }}>
              {message.reply_to_sender_name || 'Unknown'}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
              {message.reply_to_content || ''}
            </div>
          </div>
        )}

        {/* Message content */}
        {isImage ? (
          <img
            src={mediaUrl(message.content)}
            alt="sent image"
            className="max-w-xs max-h-60 rounded-lg border border-gray-200"
            style={{ marginBottom: 4 }}
          />
        ) : isVoice ? (
          <audio
            controls
            src={mediaUrl(message.content)}
            style={{ maxWidth: 220, marginBottom: 4 }}
            preload="metadata"
          />
        ) : (
          <p className="nexus-bubble-text">{message.content}</p>
        )}

        <span className="nexus-bubble-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
