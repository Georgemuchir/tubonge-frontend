import React, { useState } from 'react';
import { Search, X, UserPlus, User } from 'lucide-react';
import { usersAPI } from '../services/api';

const UserSearch = ({ isOpen, onClose, onAddContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (email) => {
    if (!email.trim()) {
      setSearchResults([]);
      setError('');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await usersAPI.searchUsers(email);
      // Backend returns { users: [...] }, axios gives us .data automatically
      const users = response.data?.users || [];
      setSearchResults(users);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = (user) => {
    if (onAddContact) {
      onAddContact(user);
    }
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Find Users</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {error && (
              <div className="text-center py-4 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            
            {!loading && !error && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-650 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddContact(user)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && !error && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <User size={32} className="mx-auto mb-2 opacity-50" />
                <p>No users found</p>
                <p className="text-xs mt-1">Try searching by name or email</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
