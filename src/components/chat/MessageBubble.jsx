const MessageBubble = ({ message, isOwnMessage, showAvatar, otherParticipant }) => {
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`nexus-message-modern ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`nexus-bubble-modern ${isOwnMessage ? 'bubble-me' : 'bubble-other'}`}>
        {message.message_type === 'image' || (typeof message.content === 'string' && message.content.startsWith('/api/messages/image/')) ? (
          <img
            src={message.content}
            alt="sent image"
            className="max-w-xs max-h-60 rounded-lg border border-gray-200"
            style={{ marginBottom: 4 }}
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
