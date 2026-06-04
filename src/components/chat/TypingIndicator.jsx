import { resolveMediaUrl } from '../../services/api';

const TypingIndicator = ({ user }) => {
  return (
    <div className="flex items-end mb-4">
      {/* Avatar */}
      <div className="flex-shrink-0 mr-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img 
              src={resolveMediaUrl(user.avatar)}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </div>

      {/* Typing Animation */}
      <div className="bg-gray-100 rounded-lg rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;