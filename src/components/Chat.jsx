import { useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import ConversationList from './chat/ConversationList';
import ChatWindow from './chat/ChatWindow';
import UserSidebar from './chat/UserSidebar';
import '../styles/nexus-chat.css';

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
    <>
      {/* Animated Background */}
      <div className="animated-bg"></div>
      <div className="floating-orbs">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>
      
      <div className="nexus-chat-container">
        {/* Mobile: Show only one component at a time */}
        <div className="md:hidden h-full">
          {activeConversation ? (
            <div className="nexus-chat-area active">
              <ChatWindow />
            </div>
          ) : (
            <div className="nexus-inbox-sidebar">
              <ConversationList />
            </div>
          )}
        </div>

        {/* Desktop: Show sidebar and chat */}
        <div className="hidden md:contents">
          {/* Conversation List with Nexus styling */}
          <div className="nexus-inbox-sidebar">
            <ConversationList />
          </div>
          
          {/* Chat Window */}
          {activeConversation ? (
            <div className="nexus-chat-area">
              <ChatWindow />
            </div>
          ) : (
            <div className="nexus-chat-area">
              <div className="nexus-empty-state">
                <div className="nexus-empty-icon">💬</div>
                <div className="nexus-empty-text">Welcome to Nexus Chat</div>
                <div className="nexus-empty-subtext">Select a conversation to start messaging</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Chat;