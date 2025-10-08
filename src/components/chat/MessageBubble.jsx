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
    <div className={`nexus-message ${isOwnMessage ? 'sent' : 'received'}`}>
      <div className="nexus-message-bubble">
        <div className="nexus-message-text">{message.content}</div>
        <div className="nexus-message-time">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
};

export default MessageBubble;
