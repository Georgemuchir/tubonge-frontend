import { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/clean-chat.css';

const CleanChat = () => {
  const { isAuthenticated } = useAuth();
  const { conversations } = useChat();
  const [showNew, setShowNew] = useState(false);

  const openNew = () => setShowNew(true);

  return (
    <div className="clean-app-container">
      <header className="clean-topbar">
        <div className="clean-topbar-title">Pinglo</div>
        <button className="clean-new-btn" onClick={openNew}>
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
            <p>You're all set. Create your first conversation to get started. This clean layout intentionally avoids any pre-filled demos.</p>
            <button className="clean-start-btn" onClick={openNew}>Start a conversation</button>
          </div>
        </main>
      </div>

      <footer className="clean-footer">Pinglo • Lightweight chat UI</footer>
    </div>
  );
};

export default CleanChat;
