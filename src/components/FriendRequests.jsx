import React, { useState, useEffect } from 'react';
import { X, UserCheck, UserX, Clock } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

const FriendRequests = ({ isOpen, onClose }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getIncomingRequests, acceptFriendRequest } = useChat();

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const requests = await getIncomingRequests();
      setIncomingRequests(requests);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      // Remove from list
      setIncomingRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('Failed to accept friend request. Please try again.');
    }
  };

  const handleDecline = async (requestId) => {
    // TODO: Implement decline endpoint on backend
    console.log('Decline not yet implemented:', requestId);
    alert('Decline functionality coming soon!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserCheck size={20} />
            Friend Requests
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            
            {!loading && incomingRequests.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No pending friend requests</p>
                <p className="text-xs mt-1">You'll see requests here when users want to connect</p>
              </div>
            )}
            
            {!loading && incomingRequests.length > 0 && (
              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold shadow-md">
                        {request.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.fromUser?.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-400">@{request.fromUser?.username || 'unknown'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request._id)}
                        className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                        title="Accept friend request"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button
                        onClick={() => handleDecline(request._id)}
                        className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
                        title="Decline friend request"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;
