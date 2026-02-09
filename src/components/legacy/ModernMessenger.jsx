import React, { useState } from 'react';
import { 
  Search, Phone, Video, Info, Image, Mic, Send, Smile, 
  ArrowLeft, UserPlus, MoreVertical, PlusCircle, Paperclip,
  Check, CheckCheck, Users
} from 'lucide-react';
import UserSearch from '../UserSearch';
import FriendRequests from '../FriendRequests';

const ModernMessenger = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample chat data
  const chats = [
    {
      id: 1,
      name: 'Sarah Wilson',
      avatar: 'SW',
      avatarColor: 'from-purple-500 to-pink-500',
      lastMessage: 'See you tomorrow! 🎉',
      time: '2:45 PM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Tech Team',
      avatar: 'TT',
      avatarColor: 'from-blue-500 to-cyan-500',
      lastMessage: 'Alex: The deployment is complete',
      time: '1:30 PM',
      unread: 5,
      online: false
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: 'MJ',
      avatarColor: 'from-green-500 to-emerald-500',
      lastMessage: 'Thanks for the help!',
      time: '11:20 AM',
      unread: 0,
      online: true
    },
    {
      id: 4,
      name: 'Emma Davis',
      avatar: 'ED',
      avatarColor: 'from-orange-500 to-red-500',
      lastMessage: 'You: Perfect, sounds good',
      time: 'Yesterday',
      unread: 0,
      online: false
    }
  ];

  // Sample messages
  const messages = {
    1: [
      { id: 1, text: 'Hey! How are you?', sent: false, time: '2:30 PM', read: true },
      { id: 2, text: "I'm great! Just finished the project", sent: true, time: '2:32 PM', read: true },
      { id: 3, text: "That's awesome! Want to celebrate?", sent: false, time: '2:35 PM', read: true },
      { id: 4, text: 'Absolutely! When are you free?', sent: true, time: '2:40 PM', read: true },
      { id: 5, text: 'How about tomorrow evening?', sent: false, time: '2:42 PM', read: true },
      { id: 6, text: 'Perfect! See you then 😊', sent: true, time: '2:44 PM', read: true },
      { id: 7, text: 'See you tomorrow! 🎉', sent: false, time: '2:45 PM', read: false }
    ]
  };

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      
      {/* ========================================
          SIDEBAR - Conversations List
          ======================================== */}
      <div className={`${
        selectedChat ? 'hidden md:flex' : 'flex'
      } flex-col w-full md:w-96 bg-black/40 backdrop-blur-xl border-r border-white/10`}>
        
        {/* Sidebar Header */}
        <div className="p-4 space-y-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Messages
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFriendRequests(true)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50"
                title="Friend Requests"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50"
                title="Add Friend"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-white/5 hover:bg-white/5 ${
                selectedChat?.id === chat.id ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-4 border-l-purple-500' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${chat.avatarColor} flex items-center justify-center text-white font-semibold text-lg shadow-lg`}>
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
              </div>

              {/* Unread Badge */}
              {chat.unread > 0 && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shadow-lg">
                    {chat.unread}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================
          CHAT WINDOW - Messages Area
          ======================================== */}
      <div className={`${
        selectedChat ? 'flex' : 'hidden md:flex'
      } flex-col flex-1 bg-gradient-to-br from-gray-900 to-black`}>
        
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                {/* Back Button (Mobile) */}
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="relative">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${selectedChat.avatarColor} flex items-center justify-center text-white font-semibold shadow-lg`}>
                    {selectedChat.avatar}
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>
                  )}
                </div>

                {/* Name & Status */}
                <div>
                  <h2 className="font-semibold text-white">{selectedChat.name}</h2>
                  <p className="text-xs text-gray-400">
                    {selectedChat.online ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-105">
                  <Phone className="w-5 h-5 text-purple-400" />
                </button>
                <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-105">
                  <Video className="w-5 h-5 text-pink-400" />
                </button>
                <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all transform hover:scale-105">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messages[selectedChat.id] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sent ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[70%] ${msg.sent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        msg.sent
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm shadow-lg shadow-purple-500/30'
                          : 'bg-white/10 backdrop-blur-sm text-white rounded-bl-sm border border-white/10'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-gray-500">{msg.time}</span>
                      {msg.sent && (
                        msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-500" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-end gap-2">
                {/* Attachment Button */}
                <button className="p-3 hover:bg-white/10 rounded-xl transition-all transform hover:scale-105 flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>

                {/* Input Container */}
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all max-h-32 overflow-y-auto"
                    style={{ minHeight: '48px' }}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform">
                    <Smile className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30 animate-pulse">
              <PlusCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Select a conversation
            </h2>
            <p className="text-gray-400 mb-6">
              Choose from your existing conversations or start a new one
            </p>
            <button
              onClick={() => setShowUserSearch(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch onClose={() => setShowUserSearch(false)} />
      )}

      {/* Friend Requests Modal */}
      {showFriendRequests && (
        <FriendRequests isOpen={showFriendRequests} onClose={() => setShowFriendRequests(false)} />
      )}

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ModernMessenger;
