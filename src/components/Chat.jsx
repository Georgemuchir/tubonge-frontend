import { useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import ConversationList from './chat/ConversationList';
import ChatWindow from './chat/ChatWindow';
import UserSidebar from './chat/UserSidebar';

const Chat = () => {
  const { conversations, activeConversation, loading } = useChat();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white">
      {/* Mobile: Show only one component at a time */}
      <div className="md:hidden h-full">
        {activeConversation ? (
          <ChatWindow />
        ) : (
          <ConversationList />
        )}
      </div>

      {/* Desktop: Show sidebar and chat */}
      <div className="hidden md:flex h-full">
        {/* User Sidebar */}
        <UserSidebar />
        
        {/* Conversation List */}
        <div className="w-80 bg-white border-r border-gray-200">
          <ConversationList />
        </div>
        
        {/* Chat Window */}
        <div className="flex-1">
          {activeConversation ? (
            <ChatWindow />
          ) : (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center px-4">
                <div className="w-24 h-24 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Your Messages</h2>
                <p className="text-gray-500 text-sm mb-4">Send private photos and messages to a friend or group.</p>
                <button className="bg-blue-500 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-600">
                  Send Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;