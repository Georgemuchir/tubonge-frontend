import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';

const UserSearchModal = ({ onClose, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createConversation, setActiveConversation } = useChat();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers(searchTerm);
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async (query) => {
    try {
      setLoading(true);
      setError('');
      const response = await usersAPI.searchUsers(query);
      setUsers(response.data.users || []);
    } catch (error) {
      setError('Error searching users');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (selectedUser) => {
    try {
      // Create or get existing conversation
      const conversation = await createConversation(selectedUser.id);
      
      // Set as active conversation
      setActiveConversation(conversation);
      
      // Call parent callback
      onSelectUser(selectedUser);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Error starting conversation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Start New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {error && (
            <div className="p-4 text-red-600 text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          )}

          {!loading && !error && searchTerm && users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found for "{searchTerm}"
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    {user.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>

                  {/* Status */}
                  <div className="text-xs text-gray-400">
                    {user.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searchTerm && (
            <div className="p-8 text-center text-gray-500">
              Enter a name or email to search for users
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;