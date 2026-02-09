import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import UserSearch from '../UserSearch';
import '../../styles/clean-chat.css';

const CleanChat = () => {
  const { isAuthenticated } = useAuth();
  const { conversations, createConversation } = useChat();
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleOpenUserSearch = () => {
    setShowUserSearch(true);
  };

  const handleCloseUserSearch = () => {
    setShowUserSearch(false);
  };

  const handleAddContact = async (user) => {
    try {
      // Create a new conversation with the selected user
      await createConversation(user.id);
      setShowUserSearch(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="clean-app-container">
      <header className="clean-topbar">
        <div className="clean-topbar-title">Pinglo</div>
        <button className="clean-new-btn" onClick={handleOpenUserSearch}>
          <span>＋</span>
          New message
        </button>
      </header>

      <div className="clean-content">
        <aside className="clean-sidebar">
          <div className="clean-sidebar-empty">
            <div className="clean-empty-icon">💬</div>
            <div className="clean-empty-title">No conversations yet</div>
            <div className="clean-empty-sub">Start a new chat to begin messaging</div>
          </div>
        </aside>

        <main className="clean-main">
          <div className="clean-welcome">
            <h1>Welcome to Pinglo</h1>
            <p>You're all set. Create your first conversation to get started.</p>
            <button className="clean-start-btn" onClick={handleOpenUserSearch}>Start a conversation</button>
          </div>
        </main>
      </div>

      <footer className="clean-footer">Pinglo • Lightweight chat UI</footer>

      {/* User Search Modal */}
      <UserSearch 
        isOpen={showUserSearch}
        onClose={handleCloseUserSearch}
        onAddContact={handleAddContact}
      />
    </div>
  );
};

export default CleanChat;
