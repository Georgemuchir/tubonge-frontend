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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end max-w-xs lg:max-w-md`}>
        {/* Avatar */}
        {!isOwnMessage && (
          <div className="flex-shrink-0 mr-2">
            {showAvatar ? (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {otherParticipant.avatar ? (
                  <img 
                    src={otherParticipant.avatar} 
                    alt={otherParticipant.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-8 h-8"></div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2 rounded-lg shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {/* Message Content */}
          <p className="text-sm leading-relaxed">{message.content}</p>
          
          {/* Timestamp and Status */}
          <div className={`flex items-center mt-1 space-x-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span className={`text-xs ${
              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(message.timestamp)}
            </span>
            
            {/* Read Status for Own Messages */}
            {isOwnMessage && (
              <div className="flex">
                <svg
                  className={`w-4 h-4 ${
                    message.read ? 'text-blue-200' : 'text-blue-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {message.read && (
                  <svg
                    className="w-4 h-4 text-blue-200 -ml-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Spacer for own messages */}
        {isOwnMessage && <div className="w-8"></div>}
      </div>
    </div>
  );
};

export default MessageBubble;