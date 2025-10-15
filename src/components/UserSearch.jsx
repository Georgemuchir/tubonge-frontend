import React, { useState } from 'react';
import { Search, X, UserPlus, User } from 'lucide-react';

const UserSearch = ({ isOpen, onClose, onAddContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (email) => {
    if (!email.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    
    // Mock data for now
    setTimeout(() => {
      const mockResults = email.includes('demo') ? [{
        id: '1',
        name: 'Demo User',
        email: 'demo@pinglo.app',
        avatar: '',
        online: true
      }] : [];
      
      setSearchResults(mockResults);
      setLoading(false);
    }, 500);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Contact</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
              placeholder="Enter email address..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            
            {!loading && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddContact(user)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <User size={32} className="mx-auto mb-2" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
