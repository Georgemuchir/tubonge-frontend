import React, { useState } from 'react';
import { Search, Phone, Video, Info, Image, Mic, Send, Smile, ArrowLeft } from 'lucide-react';

// =====================================================
// MAIN COMPONENT
// =====================================================
const ModernMessenger = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  
  // Tracks which chat is currently selected/open
  const [selectedChat, setSelectedChat] = useState(null);
  
  // Stores the current message being typed
  const [message, setMessage] = useState('');
  
  // =====================================================
  // DATA - List of all chats in the inbox
  // =====================================================
  const chats = [
    {
      id: 1,
      name: 'Sarah Wilson',
      avatar: '👩',
      lastMessage: 'See you tomorrow! 🎉',
      time: '2:45 PM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Tech Team',
      avatar: '👥',
      lastMessage: 'Alex: The deployment is complete',
      time: '1:30 PM',
      unread: 5,
      online: false
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: '👨',
      lastMessage: 'Thanks for the help!',
      time: '11:20 AM',
      unread: 0,
      online: true
    },
    {
      id: 4,
      name: 'Emma Davis',
      avatar: '👩‍🦰',
      lastMessage: 'You: Perfect, sounds good',
      time: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 5,
      name: 'Fitness Squad',
      avatar: '💪',
      lastMessage: 'Lisa: Morning workout at 6?',
      time: 'Yesterday',
      unread: 1,
      online: false
    },
    {
      id: 6,
      name: 'David Chen',
      avatar: '👨‍💼',
      lastMessage: 'Can we schedule a call?',
      time: 'Monday',
      unread: 0,
      online: true
    }
  ];

  // =====================================================
  // DATA - Messages for each chat
  // =====================================================
  const messages = {
    1: [
      { id: 1, text: 'Hey! How are you?', sent: false, time: '2:30 PM' },
      { id: 2, text: "I'm great! Just finished the project", sent: true, time: '2:32 PM' },
      { id: 3, text: 'That\'s awesome! Want to celebrate?', sent: false, time: '2:35 PM' },
      { id: 4, text: 'Absolutely! When are you free?', sent: true, time: '2:40 PM' },
      { id: 5, text: 'How about tomorrow evening?', sent: false, time: '2:42 PM' },
      { id: 6, text: 'Perfect! See you then 😊', sent: true, time: '2:44 PM' },
      { id: 7, text: 'See you tomorrow! 🎉', sent: false, time: '2:45 PM' }
    ],
    2: [
      { id: 1, text: 'Good morning team!', sent: false, time: '9:00 AM' },
      { id: 2, text: 'Morning! Ready for deployment', sent: true, time: '9:15 AM' },
      { id: 3, text: 'The deployment is complete', sent: false, time: '1:30 PM' }
    ]
  };

  // =====================================================
  // FUNCTION: Handle sending a message
  // =====================================================
  const handleSend = () => {
    if (message.trim()) {
      // Clear the message input after sending
      setMessage('');
      // In a real app, this would also add the message to the chat
    }
  };

  // =====================================================
  // FUNCTION: Handle selecting a chat from the inbox
  // =====================================================
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  // =====================================================
  // FUNCTION: Handle going back to inbox (mobile)
  // =====================================================
  const handleBackToInbox = () => {
    setSelectedChat(null);
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="flex h-screen max-h-screen bg-black text-white overflow-hidden touch-pan-y mobile-safe-area">
      
      {/* ================================================= */}
      {/* INBOX SIDEBAR */}
      {/* ================================================= */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-zinc-900 border-r border-zinc-800 h-full`}>
        
        {/* ============================================= */}
        {/* INBOX HEADER - Title and Search Bar */}
        {/* ============================================= */}
        <div className="p-3 md:p-4 border-b border-zinc-800 flex-shrink-0">
          {/* Title with gradient */}
          <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Messages
          </h1>
          
          {/* Search Bar */}
          <div className="relative">
            {/* Search Icon */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4 md:w-5 md:h-5" />
            
            {/* Search Input Field */}
            <input
              type="text"
              placeholder="Search messages"
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-zinc-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>

        {/* ============================================= */}
        {/* CHAT LIST - Scrollable list of all chats */}
        {/* ============================================= */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`flex items-center gap-3 p-3 md:p-4 cursor-pointer transition-all hover:bg-zinc-800 active:bg-zinc-700 ${
                selectedChat?.id === chat.id ? 'bg-zinc-800' : ''
              }`}
            >
              {/* Avatar with Online Status */}
              <div className="relative flex-shrink-0">
                {/* Avatar Circle */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg md:text-2xl">
                  {chat.avatar}
                </div>
                
                {/* Online Status Indicator */}
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                )}
              </div>
              
              {/* Chat Info - Name, Time, Last Message */}
              <div className="flex-1 min-w-0">
                {/* Name and Time Row */}
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold truncate text-sm md:text-base">{chat.name}</h3>
                  <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">{chat.time}</span>
                </div>
                
                {/* Last Message Preview */}
                <p className="text-xs md:text-sm text-zinc-400 truncate">{chat.lastMessage}</p>
              </div>
              
              {/* Unread Badge */}
              {chat.unread > 0 && (
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {chat.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================================================= */}
      {/* CHAT AREA - Messages and Input */}
      {/* ================================================= */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-black h-full max-h-screen`}>
        {selectedChat ? (
          <>
            {/* ========================================= */}
            {/* CHAT HEADER - Contact info and actions */}
            {/* ========================================= */}
            <div className="flex items-center gap-3 p-3 md:p-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
              {/* Back Button (Mobile Only) */}
              <button
                onClick={handleBackToInbox}
                className="md:hidden mr-1 p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              {/* Contact Avatar with Online Status */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg md:text-xl">
                  {selectedChat.avatar}
                </div>
                {selectedChat.online && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                )}
              </div>
              
              {/* Contact Name and Status */}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm md:text-base truncate">{selectedChat.name}</h2>
                <p className="text-xs text-zinc-400">
                  {selectedChat.online ? 'Active now' : 'Offline'}
                </p>
              </div>
              
              {/* Action Buttons - Call, Video, Info */}
              <div className="flex gap-2 md:gap-4 flex-shrink-0">
                <button className="hover:text-purple-400 transition-colors p-2 hover:bg-zinc-800 rounded-full">
                  <Phone className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button className="hover:text-purple-400 transition-colors p-2 hover:bg-zinc-800 rounded-full">
                  <Video className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button className="hover:text-purple-400 transition-colors p-2 hover:bg-zinc-800 rounded-full">
                  <Info className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* ========================================= */}
            {/* MESSAGES - Scrollable message history */}
            {/* ========================================= */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain p-3 md:p-4 space-y-3 md:space-y-4">
              {(messages[selectedChat.id] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-2.5 rounded-3xl ${
                      msg.sent
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                        : 'bg-zinc-800 text-white rounded-bl-md'
                    }`}
                  >
                    {/* Message Text */}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    
                    {/* Message Time */}
                    <p className={`text-xs mt-1 ${msg.sent ? 'text-purple-100' : 'text-zinc-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ========================================= */}
            {/* INPUT AREA - Message composer */}
            {/* ========================================= */}
            <div className="p-3 md:p-4 bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Image Attachment Button */}
                <button className="p-1.5 md:p-2 hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0">
                  <Image className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                </button>
                
                {/* Emoji Button */}
                <button className="p-1.5 md:p-2 hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0">
                  <Smile className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                </button>
                
                {/* Text Input Field */}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base"
                />
                
                {/* Send Button (if text entered) or Mic Button (if empty) */}
                {message.trim() ? (
                  <button
                    onClick={handleSend}
                    className="p-2 md:p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:opacity-90 transition-all flex-shrink-0"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                ) : (
                  <button className="p-1.5 md:p-2 hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0">
                    <Mic className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ========================================= */
          /* EMPTY STATE - No chat selected */
          /* ========================================= */
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl">
                💬
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Your Messages
              </h2>
              <p className="text-zinc-400">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernMessenger;