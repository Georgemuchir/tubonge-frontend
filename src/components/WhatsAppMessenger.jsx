import React, { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { MessageCircle, Send, Search, Plus, Phone, PhoneOff, Video, Info, Paperclip, Film, Smile, Sparkles, Mail, Lock, User, Users, Check, X, MoreVertical, Menu, ArrowLeft, LogOut, Settings, Sun, Moon, Mic, Square, CornerUpLeft, Trash2, Clock, UserCheck, UserX, BellOff, Bell, Archive, ArchiveRestore, ChevronRight, Rss } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { verifyBeforeUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import '../services/api';
import socketService from '../services/socket';
import { getActiveApiUrl, serverReady } from '../services/serverConfig';
import CallManager from './call/CallManager';
import GroupCallManager from './call/GroupCallManager';
import CallLogs from './call/CallLogs';
import ContactProfilePanel from './chat/ContactProfilePanel';
import NewsFeed from './NewsFeed';

const getAuthToken = async () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  return firebaseUser.getIdToken();
};

const getBase = () => getActiveApiUrl();
const getOrigin = () => getBase().replace(/\/api\/?$/, '');

const styles = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
  }
  @keyframes shimmer {
    0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }
  }

  .blob            { animation: blob 7s infinite; }
  .float-animation { animation: float 3s ease-in-out infinite; }
  .slide-up        { animation: slideUp 0.4s ease-out; }

  .glass-card {
    background: rgba(16,16,32,0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .glass-card:hover {
    border-color: rgba(124,58,237,0.35);
    box-shadow: 0 12px 40px rgba(124,58,237,0.2);
  }

  .message-sent     { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #fff; box-shadow: 0 4px 15px rgba(124,58,237,0.35); border-radius: 18px 18px 4px 18px !important; }
  .message-received { background: var(--pinglo-msg-received-bg); color: var(--pinglo-msg-received-txt); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 18px 18px 18px 4px !important; }

  .hover-lift { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
  .hover-lift:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 16px 48px rgba(124,58,237,0.3);
  }

  .scrollbar-thin::-webkit-scrollbar       { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: var(--pinglo-scrollbar-track); }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.45); border-radius: 99px; }

  /* ── Theme-aware messenger classes ── */
  .whatsapp-bg      { background-color: var(--pinglo-bg); color: var(--pinglo-text); }
  .whatsapp-header  { background: var(--pinglo-header); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
  .whatsapp-sidebar { background: var(--pinglo-sidebar); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
  .whatsapp-chat-bg {
    background-color: var(--pinglo-chat-bg);
    background-image:
      radial-gradient(circle at 80% 5%, rgba(168,85,247,0.07) 0%, transparent 50%),
      radial-gradient(circle at 10% 80%, rgba(236,72,153,0.04) 0%, transparent 50%);
  }
  .whatsapp-input         { background-color: var(--pinglo-input-bg); color: var(--pinglo-text); }
  .conversation-hover:hover { background-color: var(--pinglo-hover); border-radius: 14px; }
  .conversation-active    { background-color: var(--pinglo-active); border: 1px solid rgba(168,85,247,0.3); border-radius: 14px; }

  /* Tailwind utility overrides for light mode */
  [data-theme="light"] .text-white   { color: var(--pinglo-text) !important; }
  [data-theme="light"] .text-gray-400 { color: var(--pinglo-text-muted) !important; }
  [data-theme="light"] .text-gray-300 { color: var(--pinglo-text-muted) !important; }
  [data-theme="light"] .text-gray-500 { color: var(--pinglo-text-muted) !important; }
  [data-theme="light"] .border-gray-800 { border-color: var(--pinglo-border) !important; }
  [data-theme="light"] .border-gray-700 { border-color: var(--pinglo-border) !important; }
  [data-theme="light"] .bg-gray-800  { background-color: var(--pinglo-header) !important; }
  [data-theme="light"] .bg-gray-900  { background-color: var(--pinglo-bg) !important; }
  [data-theme="light"] .hover\:bg-gray-700:hover    { background-color: var(--pinglo-hover) !important; }
  [data-theme="light"] .hover\:bg-gray-800\/50:hover { background-color: var(--pinglo-hover) !important; }
  [data-theme="light"] .bg-gray-700\/50 { background-color: var(--pinglo-active) !important; }
  [data-theme="light"] .hover\:bg-gray-700\/50:hover { background-color: var(--pinglo-hover) !important; }
  [data-theme="light"] .border-gray-700\/50 { border-color: var(--pinglo-border) !important; }
  [data-theme="light"] .ring-gray-700\/50 { --tw-ring-color: var(--pinglo-border) !important; }

  .blue-accent  { color: #3b82f6; }
  .blue-bg      { background-color: #3b82f6; }
  .blue-bg-hover:hover { background-color: #2563eb; }
  .green-accent { color: #10b981; }
  .green-bg     { background-color: #10b981; }
  .orange-accent{ color: #f97316; }
  .orange-bg    { background-color: #f97316; }
  .grey-bg      { background-color: #64748b; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fadeIn 0.2s ease-out; }

  /* Dynamic viewport height — fixes iOS Safari address-bar clipping */
  .app-root {
    height: 100vh;
    height: 100dvh;
  }

  /* Smooth inertia scroll + prevent body scroll bleed */
  .messages-area {
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .mobile-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 100%;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.3s ease-out;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    .mobile-sidebar.active {
      transform: translateX(0);
    }

    .mobile-chat {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 40;
    }

    .touch-target {
      min-height: 44px;
      min-width: 44px;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .safe-area-bottom {
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
    }
  }
`;

const ForwardModal = ({ msg, inbox, onClose, onForward, resolveMediaUrl }) => {
  const [query, setQuery] = useState('');
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };
  const filtered = inbox.filter(c => {
    const name = c.sender_name || c.name || '';
    return !query || name.toLowerCase().includes(query.toLowerCase());
  });
  const preview = msg.message_type === 'image' ? '📷 Photo'
    : msg.message_type === 'voice' ? '🎤 Voice note'
    : msg.message_type === 'video' ? '🎥 Video'
    : msg.content;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="whatsapp-header rounded-2xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()} style={{animation: 'scaleUp 0.3s ease-out'}}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-white">Forward to...</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <div className="mb-3 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 text-sm truncate">
          <span className="text-gray-500 mr-1">Forwarding:</span>{preview}
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts..." autoFocus
            className="w-full pl-12 pr-4 py-3 rounded-lg whatsapp-input text-white placeholder-gray-400 focus:outline-none border-none" />
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">No contacts found</p>
          ) : filtered.map(contact => {
            const name = contact.sender_name || contact.name || 'Unknown';
            return (
            <div key={contact.sender_id || contact.id} onClick={() => onForward(contact)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${getAvatarColor(name)}cc, ${getAvatarColor(name)}55)`, border: `1.5px solid ${getAvatarColor(name)}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0, boxShadow: `0 0 10px ${getAvatarColor(name)}33` }}>
                {contact.avatar ? <img src={resolveMediaUrl(contact.avatar)} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
              </div>
              <p className="text-white font-medium">{name}</p>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

const UserSearch = ({ onClose, onSelectUser, resolveMediaUrl }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers('');
  }, []);

  const loadUsers = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(`${getBase()}/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    loadUsers(query);
  };

  const getAvatarColor = (name) => {
    const colors = ['#ec4899', '#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#818cf8'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="whatsapp-header rounded-2xl p-6 w-full max-w-md border border-gray-700" onClick={(e) => e.stopPropagation()} style={{animation: 'scaleUp 0.3s ease-out'}}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">New Chat</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 rounded-lg whatsapp-input text-white placeholder-gray-400 focus:outline-none border-none"
          />
        </div>
        
        <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            searchResults.map((user) => (
              <div 
                key={user.id || user._id} 
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${getAvatarColor(user.name)}cc, ${getAvatarColor(user.name)}55)`, border: `1.5px solid ${getAvatarColor(user.name)}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', overflow: 'hidden', boxShadow: `0 0 10px ${getAvatarColor(user.name)}33` }}>
                  {user.avatar ? (
                    <img
                      src={resolveMediaUrl(user.avatar)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const LONG_PRESS_MS = 500;

const menuBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '11px 16px', background: 'none', border: 'none',
  color: '#e5e7eb', cursor: 'pointer', fontSize: 14, fontWeight: 500,
  width: '100%', textAlign: 'left',
  transition: 'background 0.12s',
};

const ConversationItem = ({ conv, index, onSelectUser, onDelete, onMute, onArchive, isMuted, isArchived, resolveMediaUrl }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressRef = useRef(null);
  const movedRef = useRef(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  /* ── touch: long-press ── */
  const onTouchStart = () => {
    movedRef.current = false;
    longPressRef.current = setTimeout(() => { if (!movedRef.current) openMenu(); }, LONG_PRESS_MS);
  };
  const onTouchMove = () => { movedRef.current = true; clearTimeout(longPressRef.current); };
  const onTouchEnd = () => clearTimeout(longPressRef.current);

  /* ── mouse: right-click ── */
  const onContextMenu = (e) => { e.preventDefault(); openMenu(); };

  const handleClick = () => {
    if (menuOpen) { closeMenu(); return; }
    onSelectUser(conv);
  };

  return (
    <div style={{ position: 'relative', padding: '0 10px' }}>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={onContextMenu}
        onClick={handleClick}
        style={{ userSelect: 'none', animationDelay: `${index * 0.02}s`, borderRadius: 14, marginBottom: 2, transition: 'background 0.15s' }}
        className="p-3 cursor-pointer conversation-hover slide-up"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${conv.color}cc, ${conv.color}55)`, border: `1.5px solid ${conv.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', boxShadow: `0 0 10px ${conv.color}33` }}>
              {conv.avatar
                ? <img src={resolveMediaUrl(conv.avatar)} alt={conv.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                : conv.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {conv.online && (
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 11, height: 11, borderRadius: '50%',
                background: '#22d3a5', border: '2px solid #0d0b1a',
                boxShadow: '0 0 6px #22d3a5aa',
              }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 style={{ color: '#f0eaff', fontWeight: 600, fontSize: 14 }} className="truncate flex items-center gap-1.5">
                {conv.name}
                {isMuted && <BellOff style={{ width: 11, height: 11, color: 'rgba(240,234,255,0.3)', flexShrink: 0 }} />}
              </h3>
              <span style={{ fontSize: 11, color: 'rgba(240,234,255,0.3)', fontWeight: 500 }} className="ml-2 flex-shrink-0">{conv.time}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p style={{ fontSize: 12, color: 'rgba(240,234,255,0.45)' }} className="truncate flex-1">
                {conv._isRequest
                  ? <span style={{ color: '#a78bfa' }}>{conv.lastMessage}</span>
                  : conv.lastMessageType === 'missed_call'
                    ? <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}><PhoneOff style={{ width: 12, height: 12 }} />{conv.lastMessage || 'Missed call'}</span>
                    : conv.lastMessageType === 'image' ? '📷 Photo'
                    : conv.lastMessageType === 'video' ? '🎥 Video'
                    : (conv.lastMessage || 'No messages yet')}
              </p>
              {conv.lastMessageType === 'image' && conv.lastMessageImageUrl && (
                <img src={resolveMediaUrl(conv.lastMessageImageUrl)} alt="" className="w-9 h-9 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
              )}
              {conv._isRequest
                ? <span style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 10, fontWeight: 700, border: '1px solid rgba(99,102,241,0.4)' }}>Request</span>
                : conv.unread > 0 && (
                  <span style={{
                    flexShrink: 0, padding: '2px 7px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    boxShadow: '0 0 8px rgba(236,72,153,0.5)',
                  }}>{conv.unread}</span>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <>
          <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            zIndex: 201, background: '#1f2937',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            minWidth: 160, overflow: 'hidden',
          }}>
            <button
              onClick={() => { onMute(conv); closeMenu(); }}
              style={menuBtnStyle}
              className="hover:bg-gray-700/60"
            >
              {isMuted ? <Bell style={{ width: 16, height: 16, color: '#10b981' }} /> : <BellOff style={{ width: 16, height: 16, color: '#9ca3af' }} />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={() => { onArchive(conv); closeMenu(); }}
              style={menuBtnStyle}
              className="hover:bg-gray-700/60"
            >
              {isArchived
                ? <ArchiveRestore style={{ width: 16, height: 16, color: '#0ea5e9' }} />
                : <Archive style={{ width: 16, height: 16, color: '#0ea5e9' }} />}
              {isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={() => { onDelete(conv); closeMenu(); }}
              style={{ ...menuBtnStyle, color: '#ef4444' }}
              className="hover:bg-red-900/30"
            >
              <Trash2 style={{ width: 16, height: 16 }} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const ConversationsView = ({ conversations, inboxLoading, onSelectUser, onNewMessage, onOpenSidebar, isMobile, searchQuery, setSearchQuery, resolveMediaUrl, user, onDelete, onMute, onArchive, mutedIds, archivedIds }) => {
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const activeConvs = conversations.filter(c => !archivedIds.has(c.id));
  const archivedConvs = conversations.filter(c => archivedIds.has(c.id));
  const tabFiltered = activeTab === 'Unread'
    ? activeConvs.filter(c => c.unread > 0)
    : activeConvs;
  const displayConvs = showArchived ? archivedConvs : tabFiltered;

  return (
    <div className="flex-1 flex flex-col min-h-0 whatsapp-bg border-l border-gray-800">
      {/* Header */}
      <div style={{ padding: '20px 20px 0', background: 'var(--pinglo-header)', borderBottom: '1px solid var(--pinglo-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showArchived ? (
              <button onClick={() => setShowArchived(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(240,234,255,0.45)', display: 'flex' }}>
                <ArrowLeft style={{ width: 20, height: 20 }} />
              </button>
            ) : isMobile && (
              <button onClick={onOpenSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#f0eaff', display: 'flex' }}>
                <Menu style={{ width: 22, height: 22 }} />
              </button>
            )}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(168,85,247,0.4)', flexShrink: 0,
            }}>
              <MessageCircle style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0eaff', letterSpacing: '-0.3px', margin: 0 }}>
                {showArchived ? 'Archived' : (user?.username ? `@${user.username}` : user?.name || 'Messages')}
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(240,234,255,0.4)', margin: 0 }}>
                {inboxLoading ? 'Loading…' : showArchived ? `${archivedConvs.length} archived` : `${activeConvs.length} active chats`}
              </p>
            </div>
          </div>
          {!showArchived && (
            <button onClick={onNewMessage} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 0 14px rgba(168,85,247,0.45)',
            }}>
              <Plus style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '9px 14px', marginBottom: 12 }}>
          <Search style={{ width: 14, height: 14, color: 'rgba(240,234,255,0.3)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            style={{ background: 'none', border: 'none', outline: 'none', color: '#f0eaff', fontSize: 13, flex: 1, fontFamily: 'inherit' }}
          />
        </div>

        {/* Tabs */}
        {!showArchived && (
          <div style={{ display: 'flex', gap: 6, paddingBottom: 14 }}>
            {['All', 'Unread'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: activeTab === tab ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab ? '#fff' : 'rgba(240,234,255,0.45)',
                boxShadow: activeTab === tab ? '0 0 12px rgba(168,85,247,0.4)' : 'none',
                transition: 'all 0.15s',
              }}>{tab}</button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin whatsapp-sidebar messages-area" style={{ paddingTop: 6 }}>
        {inboxLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-sm">Loading conversations…</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 slide-up">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl"></div>
              <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 shadow-2xl">
                <MessageCircle className="w-16 h-16 text-gray-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              No conversations yet
            </h3>
            <p className="text-gray-400 mb-8 max-w-md text-lg leading-relaxed">
              Start messaging by clicking the + button to find and connect with people
            </p>
            <button
              onClick={onNewMessage}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Start New Chat
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {displayConvs.map((conv, index) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                index={index}
                onSelectUser={onSelectUser}
                onDelete={onDelete}
                onMute={onMute}
                onArchive={onArchive}
                isMuted={mutedIds.has(conv.id)}
                isArchived={archivedIds.has(conv.id)}
                resolveMediaUrl={resolveMediaUrl}
              />
            ))}
            {/* Archived row — only shown in main view when there are archived chats */}
            {!showArchived && archivedConvs.length > 0 && (
              <button
                onClick={() => setShowArchived(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', background: 'none', border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  color: '#9ca3af', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                className="hover:bg-gray-800/40"
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(14,165,233,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Archive style={{ width: 22, height: 22, color: '#0ea5e9' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15 }}>Archived</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{archivedConvs.length} chat{archivedConvs.length !== 1 ? 's' : ''}</div>
                </div>
                <ChevronRight style={{ width: 18, height: 18, color: '#4b5563' }} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WhatsAppMessenger = () => {
  const { logout, user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [_conversationId, setConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [mutedIds, setMutedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pinglo_muted') || '[]')); } catch { return new Set(); }
  });
  const [archivedIds, setArchivedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pinglo_archived') || '[]')); } catch { return new Set(); }
  });
  const [totalUnread, setTotalUnread] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCallLogs, setShowCallLogs] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [navTab, setNavTab] = useState('chat');

  const switchTab = (tab) => {
    setNavTab(tab);
    setShowFeed(tab === 'feed');
    setShowCallLogs(tab === 'calls');
    setShowSettings(false);
    if (tab !== 'chat') setSelectedUser(null);
  };
  const typingTimeoutRef = useRef(null);
  const messageImageInputRef = useRef(null);
  const messageVideoInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const messagesEndRef = useRef(null);
  const callManagerRef = useRef(null);
  const groupCallManagerRef = useRef(null);
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', username: '', phone_number: '' });
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [activeMsg, setActiveMsg] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [showLastSeen, setShowLastSeen] = useState(user?.show_last_seen !== false);
  const [usernameEdit, setUsernameEdit] = useState('');
  const [usernameEditMode, setUsernameEditMode] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailChangeInput, setEmailChangeInput] = useState('');
  const [emailChangeSending, setEmailChangeSending] = useState(false);
  const [emailChangeMsg, setEmailChangeMsg] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  const [emailChangeNeedsReauth, setEmailChangeNeedsReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [chatStatus, setChatStatus] = useState('NONE'); // NONE | OUTGOING_PENDING | INCOMING_PENDING | ACCEPTED
  const [pendingText, setPendingText] = useState('');
  const [incomingRequest, setIncomingRequest] = useState(null); // { requestId, text }

  const formatLastSeen = (ts) => {
    if (!ts) return 'Offline';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return 'Offline';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays} days ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  // Close settings panel on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e) => {
      if (
        !e.target.closest('[data-settings-panel]') &&
        !e.target.closest('[data-settings-popup]')
      ) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  // Fetch inbox on mount
  useEffect(() => {
    fetchInbox();
  }, []);

  // Keep-alive ping every 10 min to prevent Render free tier cold starts
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${getBase()}/health`).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll to bottom when conversation opens or message count changes
  useEffect(() => {
    if (!selectedUser || loading) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser, loading, messages.length]);

  const fetchInbox = async () => {
    // Show cached inbox immediately — zero wait on every load after the first
    try {
      const cached = localStorage.getItem('pinglo_inbox_cache');
      if (cached) {
        const { merged, totalUnread, onlineMap } = JSON.parse(cached);
        setInbox(merged);
        setTotalUnread(totalUnread);
        setOnlineUsers(onlineMap);
        setInboxLoading(false);
      }
    } catch {}

    // Fetch fresh data in background (don't block UI)
    try {
      await serverReady;
      const token = await getAuthToken();
      const [inboxRes, reqRes] = await Promise.all([
        fetch(`${getBase()}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getBase()}/messages/requests`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const inboxData = inboxRes.ok ? await inboxRes.json() : {};
      const reqData = reqRes.ok ? await reqRes.json() : {};

      const inboxItems = inboxData.inbox || [];
      const requestItems = (reqData.requests || []).map(r => ({
        sender_id: r.sender_id,
        sender_name: r.sender_name,
        sender_username: r.sender_username,
        sender_avatar: r.sender_avatar,
        last_message: r.text,
        last_message_type: r.message_type,
        last_message_time: r.created_at,
        unread_count: 1,
        _isRequest: true,
        _requestId: r.id,
      }));

      const requestSenderIds = new Set(requestItems.map(r => r.sender_id));
      const merged = [...requestItems, ...inboxItems.filter(i => !requestSenderIds.has(i.sender_id))];
      const totalUnread = (inboxData.total_unread || 0) + requestItems.length;
      const onlineMap = {};
      inboxItems.forEach(item => { onlineMap[item.sender_id] = item.online || false; });

      setInbox(merged);
      setTotalUnread(totalUnread);
      setOnlineUsers(onlineMap);

      // Persist for next load
      try {
        localStorage.setItem('pinglo_inbox_cache', JSON.stringify({ merged, totalUnread, onlineMap }));
      } catch {}
    } catch (error) {
      console.error('Fetch inbox error:', error);
    } finally {
      setInboxLoading(false);
    }
  };

  // Socket.IO listeners
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.sender_id;
      const receiverId = newMessage.receiver_id;
      const selectedId = selectedUser && (selectedUser.id || selectedUser._id);

      // Show message if it's part of the current chat (sender or receiver)
      if (selectedUser && (senderId === selectedId || receiverId === selectedId)) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New message from Pinglo', {
          body: newMessage.content.substring(0, 50),
          icon: '/favicon.ico'
        });
      }
    };

    const handleUserStatus = (statusData) => {
      setOnlineUsers(prev => ({
        ...prev,
        [statusData.user_id]: statusData.status === 'online'
      }));

      if (selectedUser && (selectedUser.id === statusData.user_id || selectedUser._id === statusData.user_id)) {
        setSelectedUser(prev => ({
          ...prev,
          online: statusData.status === 'online',
          last_seen: statusData.status === 'offline' ? (statusData.last_seen || prev.last_seen) : prev.last_seen,
        }));
      }
    };

    const handleUserTyping = (data) => {
      const senderId = data.user_id || data.sender_id;
      const isTyping = data.is_typing || false;
      if (!senderId) return;
      setTypingUsers(prev => ({ ...prev, [senderId]: !!isTyping }));
      
      if (selectedUser && (selectedUser.id === senderId || selectedUser._id === senderId)) {
        setSelectedUser(prev => ({ ...prev, isTyping: !!isTyping }));
      }
    };

    const handleMessageDeleted = ({ message_id }) => {
      setMessages(prev => prev.map(m =>
        (m.id || m._id) === message_id ? { ...m, _deleted: true } : m
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('inbox_update', fetchInbox);
    socket.on('user_status', handleUserStatus);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('inbox_update', fetchInbox);
      socket.off('user_status', handleUserStatus);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [selectedUser]);

  // Check message request status whenever conversation changes
  useEffect(() => {
    if (!selectedUser) { setChatStatus('NONE'); setPendingText(''); setIncomingRequest(null); return; }
    const userId = selectedUser.id || selectedUser._id;
    (async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`${getBase()}/messages/chat-status/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setChatStatus(data.status || 'NONE');
        if (data.status === 'OUTGOING_PENDING') {
          setPendingText(data.text || '');
        }
        if (data.status === 'INCOMING_PENDING') {
          setIncomingRequest(prev => ({
            requestId: data.request_id || prev?.requestId || '',
            text: data.text || prev?.text || '',
          }));
        }
      } catch {
        setChatStatus(prev => prev === 'INCOMING_PENDING' ? prev : 'NONE');
      }
    })();
  }, [selectedUser?.id, selectedUser?._id]);

  // Socket: live updates for request events
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;
    const onRequest = (data) => {
      setInbox(prev => {
        const already = prev.some(i => i.sender_id === data.sender_id && i._isRequest);
        if (already) return prev;
        return [{
          sender_id: data.sender_id,
          sender_name: data.sender_name || 'Someone',
          sender_username: data.sender_username || '',
          sender_avatar: data.sender_avatar || '',
          last_message: data.text || '',
          last_message_type: data.message_type || 'text',
          last_message_time: new Date().toISOString(),
          unread_count: 1,
          _isRequest: true,
          _requestId: data.request_id,
        }, ...prev];
      });
      const otherId = selectedUser?.id || selectedUser?._id;
      if (data.sender_id === otherId) {
        setIncomingRequest({ requestId: data.request_id, text: data.text || '' });
        setChatStatus('INCOMING_PENDING');
      }
    };
    const onAccepted = async () => {
      setChatStatus('ACCEPTED');
      setPendingText('');
      await fetchInbox();
    };
    socket.on('message_request', onRequest);
    socket.on('request_accepted', onAccepted);
    return () => { socket.off('message_request', onRequest); socket.off('request_accepted', onAccepted); };
  }, [selectedUser]);

  // Handle window resize
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAvatarColor = (name) => {
    const colors = ['#ec4899', '#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#818cf8'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    }
  };

  const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${getOrigin()}${url}`;
  };

  const handleDeleteConversation = async (conv) => {
    const userId = conv.id || conv.sender_id;
    try {
      const token = await getAuthToken();
      await fetch(`${getBase()}/messages/conversation/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* best-effort */ }
    setInbox(prev => prev.filter(c => c.sender_id !== userId && c.id !== userId));
  };

  const handleMuteConversation = (conv) => {
    const userId = conv.id || conv.sender_id;
    setMutedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); } else { next.add(userId); }
      localStorage.setItem('pinglo_muted', JSON.stringify([...next]));
      return next;
    });
  };

  const handleArchiveConversation = (conv) => {
    const userId = conv.id || conv.sender_id;
    setArchivedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); } else { next.add(userId); }
      localStorage.setItem('pinglo_archived', JSON.stringify([...next]));
      return next;
    });
  };

  const handleUserSelect = async (user) => {
    const userId = user.id || user._id;
    if (!userId || userId === 'None' || userId === 'null') return;
    setSelectedUser(user);
    setLoading(true);
    setShowMobileSidebar(false);
    // If this is an incoming request, set status immediately
    if (user._isRequest && user._requestId) {
      setChatStatus('INCOMING_PENDING');
      setIncomingRequest({ requestId: user._requestId, text: user.lastMessage || '' });
    }
    try {
      await fetch(`${getBase()}/messages/mark-read/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      fetchInbox();
    } catch (error) {
      console.error('Mark read error:', error);
    }
    try {
      const response = await fetch(`${getBase()}/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        // Set conversationId if available
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        } else if (data.messages && data.messages.length > 0 && data.messages[0].conversation_id) {
          setConversationId(data.messages[0].conversation_id);
        } else {
          setConversationId(null);
        }
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!selectedUser) {
      setSendError('Select a conversation before sending.');
      return;
    }
    setSendError('');

    // Capture state NOW before any awaits can run
    const tempId = `temp_${Date.now()}`;
    const sentText = message;
    const sentReplyTo = replyTo;
    const recipientId = selectedUser.id || selectedUser._id;
    const now = new Date().toISOString();

    // Optimistic update FIRST — message bubble + inbox preview update in the same paint frame
    flushSync(() => {
      setMessages(prev => [...prev, {
        id: tempId,
        sender_id: user?.id || user?._id,
        recipient_id: recipientId,
        content: sentText,
        timestamp: now,
        message_type: 'text',
        _optimistic: true,
        ...(replyTo && {
          reply_to_content: replyTo.content,
          reply_to_sender_name: replyTo.sender_id === (user?.id || user?._id) ? (user?.name || 'You') : (selectedUser?.name || 'Them'),
        }),
      }]);
      setMessage('');
      setReplyTo(null);
      // Update inbox sidebar instantly — no waiting for fetchInbox round-trip
      setInbox(prev => {
        const updated = prev.map(item =>
          item.sender_id === recipientId
            ? { ...item, last_message: sentText, last_message_time: now, last_message_type: 'text' }
            : item
        );
        try {
          const raw = localStorage.getItem('pinglo_inbox_cache');
          if (raw) {
            const c = JSON.parse(raw);
            c.merged = updated;
            localStorage.setItem('pinglo_inbox_cache', JSON.stringify(c));
          }
        } catch {}
        return updated;
      });
    });

    // Server selection + auth run after the UI is already updated
    await serverReady;
    const token = await getAuthToken();

    try {
      const socket = socketService.socket;
      if (socket && selectedUser) {
        socket.emit('typing_user', {
          recipient_id: selectedUser.id || selectedUser._id,
          sender_id: user?.id || user?._id,
          is_typing: false
        });
      }
    } catch {}

    const sendPayload = () => fetch(`${getBase()}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        recipient_id: recipientId,
        content: sentText,
        ...(sentReplyTo && {
          reply_to_id: sentReplyTo.id || sentReplyTo._id,
          reply_to_content: sentReplyTo.content,
          reply_to_sender_name: sentReplyTo.sender_id === (user?.id || user?._id) ? (user?.name || 'You') : (selectedUser?.name || 'Them'),
        }),
      }),
    });

    let response;
    try {
      response = await sendPayload();
    } catch {
      // First attempt failed (server may be waking up) — wait 4 s and retry once
      setSendError('Connecting to server…');
      await new Promise(r => setTimeout(r, 4000));
      try {
        response = await sendPayload();
        setSendError('');
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setMessage(sentText);
        setReplyTo(sentReplyTo);
        setSendError('Server unreachable. Please try again.');
        return;
      }
    }

    if (response.status === 201) {
      const data = await response.json();
      if (data.status === 'pending_request') {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setChatStatus('OUTGOING_PENDING');
        setPendingText(sentText);
        fetchInbox();
        return;
      }
    }
    if (response.ok) {
      const data = await response.json();
      setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      fetchInbox();
    } else {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessage(sentText);
      setReplyTo(sentReplyTo);
      const errorData = await response.json().catch(() => ({}));
      setSendError(errorData.error || 'Failed to send message.');
    }
  };

  const uploadChatImage = async (file) => {
    await serverReady;
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    const doUpload = () => fetch(`${getBase()}/messages/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    let response;
    try {
      response = await doUpload();
    } catch {
      await new Promise(r => setTimeout(r, 4000));
      response = await doUpload();
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Image upload failed');
    }
    const data = await response.json();
    return data.url;
  };

  const handleSendImage = async (file) => {
    if (!file) return;
    if (!selectedUser) {
      setSendError('Select a conversation before sending.');
      return;
    }
    try {
      setIsSending(true);
      setSendError('');
      const imageUrl = await uploadChatImage(file);
      await serverReady;
      const token = await getAuthToken();
      const doSend = () => fetch(`${getBase()}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          recipient_id: selectedUser.id || selectedUser._id,
          content: '📷 Photo',
          message_type: 'image',
          image_url: imageUrl,
        }),
      });
      let response;
      try {
        response = await doSend();
      } catch {
        setSendError('Connecting to server…');
        await new Promise(r => setTimeout(r, 4000));
        try { response = await doSend(); setSendError(''); }
        catch (err) {
          setSendError(err.message || 'Image send failed.');
          return;
        }
      }
      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        const rid = selectedUser.id || selectedUser._id;
        const ts = new Date().toISOString();
        setInbox(prev => {
          const updated = prev.map(item =>
            item.sender_id === rid
              ? { ...item, last_message: '📷 Photo', last_message_time: ts, last_message_type: 'image' }
              : item
          );
          try {
            const raw = localStorage.getItem('pinglo_inbox_cache');
            if (raw) { const c = JSON.parse(raw); c.merged = updated; localStorage.setItem('pinglo_inbox_cache', JSON.stringify(c)); }
          } catch {}
          return updated;
        });
        fetchInbox();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSendError(errorData.error || 'Failed to send image.');
      }
    } catch (error) {
      console.error('Image send error:', error);
      setSendError(error.message || 'Image send failed.');
    } finally {
      setIsSending(false);
      if (messageImageInputRef.current) messageImageInputRef.current.value = '';
    }
  };

  const handleSendVideo = async (file) => {
    if (!file) return;
    if (!selectedUser) { setSendError('Select a conversation before sending.'); return; }
    if (file.size > 100 * 1024 * 1024) { setSendError('Video must be under 100 MB.'); return; }

    const tempId = `temp_vid_${Date.now()}`;
    const blobUrl = URL.createObjectURL(file);
    const now = new Date().toISOString();
    const recipientId = selectedUser.id || selectedUser._id;

    // Show optimistic blob preview immediately
    setMessages(prev => [...prev, {
      id: tempId,
      sender_id: user?.id || user?._id,
      recipient_id: recipientId,
      content: blobUrl,
      message_type: 'video',
      timestamp: now,
      _optimistic: true,
    }]);
    setInbox(prev => prev.map(item =>
      (item.sender_id === recipientId || item.id === recipientId)
        ? { ...item, last_message: '🎥 Video', last_message_time: now, last_message_type: 'video' }
        : item
    ));

    setUploadingVideo(true);
    setVideoUploadProgress(0);
    setSendError('');

    try {
      await serverReady;
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('video', file, file.name || 'video.mp4');

      // XHR for upload progress tracking
      const videoUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (evt) => {
          if (evt.total) setVideoUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText).url); }
            catch { reject(new Error('Invalid server response')); }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed')); }
            catch { reject(new Error('Upload failed')); }
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', `${getBase()}/messages/upload-video`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const sendRes = await fetch(`${getBase()}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_id: recipientId, content: videoUrl, message_type: 'video' }),
      });

      if (sendRes.ok) {
        const data = await sendRes.json();
        const realMessage = { ...(data.message || data), message_type: 'video' };
        setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
        URL.revokeObjectURL(blobUrl);
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        URL.revokeObjectURL(blobUrl);
        const err = await sendRes.json().catch(() => ({}));
        setSendError(err.error || 'Failed to send video.');
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      URL.revokeObjectURL(blobUrl);
      setSendError(error.message || 'Video send failed.');
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(0);
      if (messageVideoInputRef.current) messageVideoInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    if (!selectedUser) { setSendError('Select a conversation first.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceNote(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch {
      setSendError('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }
    clearInterval(recordingTimerRef.current);
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const uploadVoiceNote = async (blob) => {
    if (!selectedUser) return;
    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('voice', blob, 'voice.webm');
      const uploadRes = await fetch(`${getBase()}/messages/upload-voice`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Voice upload failed');
      const { url } = await uploadRes.json();
      const sendRes = await fetch(`${getBase()}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          recipient_id: selectedUser.id || selectedUser._id,
          content: '🎤 Voice note',
          message_type: 'voice',
          voice_url: url,
          ...(replyTo && {
            reply_to_id: replyTo.id || replyTo._id,
            reply_to_content: replyTo.content,
            reply_to_sender_name: replyTo.sender_id === (user?.id || user?._id) ? (user?.name || 'You') : (selectedUser?.name || 'Them'),
          }),
        }),
      });
      if (sendRes.ok) {
        const data = await sendRes.json();
        setMessages(prev => [...prev, data.message]);
        setReplyTo(null);
        fetchInbox();
      } else {
        setSendError('Failed to send voice note.');
      }
    } catch {
      setSendError('Failed to send voice note.');
    } finally {
      setUploadingVoice(false);
    }
  };

  const handleDelete = async (msg) => {
    const msgId = msg.id || msg._id;
    setActiveMsg(null);
    // Optimistic update — show placeholder immediately before network call
    setMessages(prev => prev.map(m =>
      (m.id || m._id) === msgId ? { ...m, _deleted: true } : m
    ));
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBase()}/messages/delete/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        // Already updated optimistically — nothing more to do
      } else {
        const data = await res.json().catch(() => ({}));
        // Revert optimistic update
        setMessages(prev => prev.map(m =>
          (m.id || m._id) === msgId ? { ...m, _deleted: false } : m
        ));
        setSendError(data.error || 'Failed to delete message.');
      }
    } catch {
      // Revert optimistic update
      setMessages(prev => prev.map(m =>
        (m.id || m._id) === msgId ? { ...m, _deleted: false } : m
      ));
      setSendError('Failed to delete message.');
    }
  };

  const handleForward = async (contact) => {
    const msg = forwardMsg;
    setForwardMsg(null);
    if (!msg || !contact) return;
    try {
      await fetch(`${getBase()}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          recipient_id: contact.sender_id || contact.id || contact._id,
          content: msg.content,
          message_type: msg.message_type || 'text',
          ...(msg.image_url && { image_url: msg.image_url }),
          ...(msg.voice_url && { voice_url: msg.voice_url }),
        }),
      });
      fetchInbox();
    } catch {
      setSendError('Failed to forward message.');
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${getBase()}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: formData,
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data.avatar) {
        updateUser({ avatar: data.avatar });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Auto-prompt when phone number is missing
  useEffect(() => {
    if (user && !user.phone_number) {
      setProfileForm({ name: user.name || '', username: user.username || '', phone_number: '' });
      setProfileError('');
      setShowProfileModal(true);
    }
  }, [user?.phone_number]);

  const openProfileModal = () => {
    setProfileForm({ name: user?.name || '', username: user?.username || '', phone_number: user?.phone_number || '' });
    setUsernameAvailable(null);
    setProfileError('');
    setEmailChangeInput('');
    setEmailChangeMsg('');
    setEmailChangeError('');
    setEmailChangeNeedsReauth(false);
    setReauthPassword('');
    setShowProfileModal(true);
    setShowSettings(false);
  };

  const handleSendEmailChangeLink = async (password = null) => {
    const newEmail = emailChangeInput.trim().toLowerCase();
    if (!newEmail || !newEmail.includes('@')) {
      setEmailChangeError('Enter a valid email address.');
      return;
    }
    if (newEmail === (user?.email || '').toLowerCase()) {
      setEmailChangeError('That is already your current email.');
      return;
    }
    setEmailChangeSending(true);
    setEmailChangeError('');
    setEmailChangeMsg('');
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Not signed in');

      // Re-authenticate first if a password was provided
      if (password) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
        setEmailChangeNeedsReauth(false);
        setReauthPassword('');
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/confirm-email-change`,
        handleCodeInApp: true,
      };
      await verifyBeforeUpdateEmail(firebaseUser, newEmail, actionCodeSettings);
      setEmailChangeMsg(`Verification link sent to ${newEmail}. Click it to confirm the change.`);
      setEmailChangeInput('');
    } catch (err) {
      const code = err?.code || '';
      console.error('[EmailChange] Firebase error:', code, err?.message, err);
      if (code === 'auth/requires-recent-login') {
        setEmailChangeNeedsReauth(true);
        setEmailChangeError('For security, please enter your password to continue.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setEmailChangeError('Incorrect password. Please try again.');
      } else if (code === 'auth/email-already-in-use') {
        setEmailChangeError('That email is already used by another account.');
      } else if (code === 'auth/invalid-email') {
        setEmailChangeError('Invalid email address.');
      } else if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
        setEmailChangeError(`Domain not authorized in Firebase (${code}). Add your app domain to Firebase Console → Authentication → Settings → Authorized domains.`);
      } else {
        setEmailChangeError(`Error (${code || 'unknown'}): ${err?.message || 'Failed to send verification link.'}`);
      }
    } finally {
      setEmailChangeSending(false);
    }
  };

  const handleUsernameChange = async (value) => {
    const trimmed = value.trim().toLowerCase();
    setProfileForm(f => ({ ...f, username: value }));
    if (!trimmed || trimmed === (user?.username || '').toLowerCase()) {
      setUsernameAvailable(null);
      return;
    }
    if (trimmed.length < 3) {
      setUsernameAvailable(false);
      return;
    }
    setUsernameChecking(true);
    try {
      const res = await fetch(`${getBase()}/users/check-username?username=${encodeURIComponent(trimmed)}`, {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` },
      });
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileForm.phone_number.trim()) {
      setProfileError('Phone number is required.');
      return;
    }
    const newUsername = profileForm.username.trim().toLowerCase();
    if (newUsername && newUsername !== (user?.username || '').toLowerCase()) {
      if (newUsername.length < 3) {
        setProfileError('Username must be at least 3 characters.');
        return;
      }
      if (usernameAvailable === false) {
        setProfileError('That username is already taken.');
        return;
      }
    }
    setProfileSaving(true);
    setProfileError('');
    try {
      const payload = {};
      if (profileForm.name.trim()) payload.name = profileForm.name.trim();
      payload.phone_number = profileForm.phone_number.trim();
      if (newUsername && newUsername !== (user?.username || '').toLowerCase()) {
        payload.username = newUsername;
      }

      const response = await fetch(`${getBase()}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setProfileError(data.error || 'Failed to save profile.');
        return;
      }
      updateUser({
        name: payload.name || user?.name,
        phone_number: payload.phone_number,
        ...(payload.username ? { username: payload.username } : {}),
      });
      setShowProfileModal(false);
    } catch {
      setProfileError('Network error. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return inbox
      .filter(conv => conv.sender_id && conv.sender_id !== 'None' && conv.sender_id !== 'null')
      .slice()
      .sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return timeB - timeA;
      })
      .filter(conv =>
        !q ||
        conv.sender_name?.toLowerCase().includes(q) ||
        conv.sender_username?.toLowerCase().includes(q)
      )
      .map(conv => ({
        id: conv.sender_id,
        _id: conv.sender_id,
        name: conv.sender_name,
        username: conv.sender_username,
        avatar: conv.sender_avatar || '',
        lastMessage: conv.last_message || '',
        lastMessageType: conv.last_message_type || 'text',
        lastMessageImageUrl: conv.last_message_image_url || '',
        time: formatTime(conv.last_message_time),
        unread: conv.unread_count,
        online: onlineUsers[conv.sender_id] || false,
        last_seen: conv.last_seen || null,
        color: getAvatarColor(conv.sender_name),
        _isRequest: conv._isRequest || false,
        _requestId: conv._requestId || null,
      }));
  }, [inbox, searchQuery, onlineUsers]);

  return (
    <div className="app-root whatsapp-bg flex overflow-hidden min-h-0">
      <style>{styles}</style>
      
      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      
      {/* Minimal Sidebar */}
      <div className={`
        ${isMobile ? 'mobile-sidebar' : 'w-20'} 
        ${isMobile && showMobileSidebar ? 'active' : ''}
        whatsapp-sidebar border-r border-gray-800 flex flex-col items-center py-6
        ${isMobile ? 'max-w-[85%]' : ''}
      `}>
        {/* User Profile */}
        <div className="mb-8 relative">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-2 ring-purple-400/40 hover:ring-purple-400/80 cursor-pointer hover:scale-105 transition-all duration-200 overflow-hidden relative border-2 border-white/10"
            title="Change profile photo"
          >
            {user?.avatar ? (
              <img
                src={resolveMediaUrl(user.avatar)}
                alt="Profile"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'P'
            )}
          </button>
          {totalUnread > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md border-2 border-gray-900" style={{background:'linear-gradient(135deg,#9333ea,#ec4899)'}}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </div>
          )}
        </div>
        
        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col gap-4 items-center">
          <button
            onClick={() => setShowUserSearch(true)}
            className="p-4 rounded-xl hover:bg-purple-500/15 text-gray-400 hover:text-purple-400 transition-all touch-target group relative"
            title="New Chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              New Chat
            </span>
          </button>

          <button
            onClick={() => { setShowFeed(v => !v); setSelectedUser(null); setShowCallLogs(false); }}
            className={`p-4 rounded-xl hover:bg-purple-500/15 transition-all touch-target group relative ${showFeed ? 'bg-purple-500/18 text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
            title="News Feed"
          >
            <Rss className="w-6 h-6" />
            {!showFeed && (
              <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                News Feed
              </span>
            )}
          </button>


          <div data-settings-panel>
            <button
              ref={settingsButtonRef}
              onClick={() => setShowSettings(v => !v)}
              className={`p-4 rounded-xl hover:bg-purple-500/15 transition-all touch-target group relative ${showSettings ? 'bg-purple-500/18 text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
              title="Settings"
            >
              <Settings className="w-6 h-6" />
              {!showSettings && (
                <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Settings
                </span>
              )}
            </button>
          </div>

        </div>
        
        {/* Logout at Bottom */}
        <button
          onClick={handleLogout}
          className="p-4 rounded-xl hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-all touch-target group relative"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-3 py-1 bg-red-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Logout
          </span>
        </button>
      </div>
      
      {/* Chat Area */}
      <div className={`flex-1 flex flex-col min-h-0 ${isMobile && selectedUser ? 'mobile-chat' : ''}`} style={{ position: 'relative' }}>
        {showFeed && !selectedUser ? (
          <NewsFeed onBack={() => setShowFeed(false)} />
        ) : showCallLogs && !selectedUser ? (
          <CallLogs
            onBack={() => setShowCallLogs(false)}
            onCallback={(call) => {
              // Find or create user object to start a call back
              const callbackUser = {
                id: call.other_user_id,
                _id: call.other_user_id,
                name: call.other_user_name,
                avatar: call.other_user_avatar,
              };
              setSelectedUser(callbackUser);
              setShowCallLogs(false);
              // Small delay to let the chat view mount, then initiate callback
              setTimeout(() => {
                callManagerRef.current?.startCall(call.call_type || 'audio');
              }, 500);
            }}
            getAvatarColor={getAvatarColor}
          />
        ) : !selectedUser ? (
          <ConversationsView
            conversations={filteredConversations}
            inboxLoading={inboxLoading}
            onSelectUser={handleUserSelect}
            onNewMessage={() => setShowUserSearch(true)}
            onOpenSidebar={() => setShowMobileSidebar(true)}
            isMobile={isMobile}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            resolveMediaUrl={resolveMediaUrl}
            user={user}
            onDelete={handleDeleteConversation}
            onMute={handleMuteConversation}
            onArchive={handleArchiveConversation}
            mutedIds={mutedIds}
            archivedIds={archivedIds}
          />
        ) : (
          <>
          {/* Chat Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', background: 'rgba(13,11,26,0.88)', position: 'relative', zIndex: 10, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {isMobile && (
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${getAvatarColor(selectedUser.name)}cc, ${getAvatarColor(selectedUser.name)}55)`, border: `1.5px solid ${getAvatarColor(selectedUser.name)}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', overflow: 'hidden', boxShadow: `0 0 10px ${getAvatarColor(selectedUser.name)}33` }}>
                  {selectedUser.avatar ? (
                    <img
                      src={resolveMediaUrl(selectedUser.avatar)}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUser.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                {(onlineUsers[selectedUser.id] || onlineUsers[selectedUser._id] || selectedUser.online) && (
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22d3a5', border: '2px solid #0d0b1a', boxShadow: '0 0 6px #22d3a5aa' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: '#f0eaff', fontWeight: 700, fontSize: 15 }} className="truncate">{selectedUser.name}</p>
                <p style={{ fontSize: 11, margin: 0 }}>
                  {(selectedUser?.isTyping || typingUsers[(selectedUser?.id || selectedUser?._id)]) ? (
                    <span style={{ color: '#22d3a5', fontStyle: 'italic' }}>typing...</span>
                  ) : (
                    (onlineUsers[selectedUser?.id] || onlineUsers[selectedUser?._id] || selectedUser?.online) ? (
                      <span style={{ color: '#22d3a5' }}>● Active now</span>
                    ) : (
                      <span style={{ color: 'rgba(240,234,255,0.4)' }}>{showLastSeen ? formatLastSeen(selectedUser?.last_seen) : 'Offline'}</span>
                    )
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Call buttons */}
              <button
                onClick={() => callManagerRef.current?.startCall('audio')}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => callManagerRef.current?.startCall('video')}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => groupCallManagerRef.current?.openInvite()}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target"
                title="Group call"
              >
                <Users className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target hidden md:block">
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowContactProfile(true)}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target"
                title="Contact info"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 whatsapp-chat-bg scrollbar-thin messages-area">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No messages yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSent = msg.sender_id === user?.id || msg.sender_id === user?._id;

                // ── Missed call message ──
                if (msg.message_type === 'missed_call') {
                  return (
                    <div key={msg.id || msg._id} className="flex justify-center my-2">
                      <div className="flex items-center gap-2 bg-gray-800/70 border border-gray-700 rounded-full px-4 py-2 shadow">
                        <PhoneOff className={`w-4 h-4 ${isSent ? 'text-gray-400' : 'text-red-400'}`} />
                        <span className={`text-sm ${isSent ? 'text-gray-300' : 'text-red-300'}`}>
                          {msg.content}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp || msg.created_at)}</span>
                      </div>
                    </div>
                  );
                }

                const msgId = msg.id || msg._id;
                const isActive = activeMsg === msgId;
                const isDeleted = msg._deleted || msg.deleted;
                return (
                  <div key={msgId} className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} ${msg._optimistic ? 'animate-fade-in' : ''}`}>
                    <div
                      className={`max-w-[85%] md:max-w-md ${isSent ? 'message-sent' : 'message-received'} rounded-lg px-3 py-2 md:px-4 md:py-2 shadow-md cursor-pointer`}
                      onClick={() => setActiveMsg(isActive ? null : msgId)}
                    >
                      {isDeleted ? (
                        <p className="text-sm italic text-gray-400">
                          {(msg.deleted_by || msg.sender_id) === (user?.id || user?._id)
                            ? 'Message deleted'
                            : 'Ooooops! message deleted 😭'}
                        </p>
                      ) : (
                        <>
                          {/* Reply quote */}
                          {msg.reply_to_content && (
                            <div className={`mb-2 pl-2 border-l-2 ${isSent ? 'border-blue-300' : 'border-gray-400'} rounded-sm`}>
                              <p className={`text-xs font-semibold mb-0.5 ${isSent ? 'text-blue-200' : 'text-gray-300'}`}>
                                {msg.reply_to_sender_name}
                              </p>
                              <p className={`text-xs truncate ${isSent ? 'text-blue-100/80' : 'text-gray-400'}`}>
                                {msg.reply_to_content}
                              </p>
                            </div>
                          )}
                          {msg.message_type === 'image' && msg.image_url ? (
                            <img src={resolveMediaUrl(msg.image_url)} alt="Shared" className="rounded-md max-w-full h-auto" loading="lazy" decoding="async" />
                          ) : msg.message_type === 'voice' && msg.voice_url ? (
                            <audio controls src={resolveMediaUrl(msg.voice_url)} className="w-full" style={{height: '44px', minWidth: '180px'}} onClick={e => e.stopPropagation()} />
                          ) : msg.message_type === 'video' ? (
                            msg.content?.startsWith('blob:') || msg.content?.startsWith('/api/') || msg.content?.startsWith('http') ? (
                              <video
                                controls
                                playsInline
                                src={msg.content.startsWith('blob:') ? msg.content : resolveMediaUrl(msg.content)}
                                style={{ maxWidth: 'min(280px, calc(85vw - 32px))', maxHeight: 220, borderRadius: 8, display: 'block', width: '100%', background: '#000', opacity: msg._optimistic ? 0.75 : 1 }}
                                preload="metadata"
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <p className="text-white text-sm leading-relaxed break-words">{msg.content || '🎥 Video'}</p>
                            )
                          ) : (
                            <p className="text-white text-sm leading-relaxed break-words">{msg.content}</p>
                          )}
                        </>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-gray-300">{formatTime(msg.timestamp || msg.created_at)}</span>
                        {isSent && <Check className="w-4 h-4 text-blue-300" />}
                      </div>
                    </div>
                    {/* Action bar — hidden for deleted messages */}
                    {isActive && !isDeleted && (
                      <div className={`flex gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <button
                          onClick={e => { e.stopPropagation(); setReplyTo(msg); setActiveMsg(null); }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-700/80 hover:bg-gray-600 text-gray-300 text-xs transition-colors"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" /> Reply
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setForwardMsg(msg); setActiveMsg(null); }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-700/80 hover:bg-gray-600 text-gray-300 text-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Forward
                        </button>
                        {isSent && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(msg); }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {/* Pending outgoing request bubble */}
            {chatStatus === 'OUTGOING_PENDING' && pendingText && (
              <div className="flex justify-end mb-2 px-4">
                <div className="max-w-xs lg:max-w-md rounded-2xl rounded-br-sm px-4 py-2 bg-blue-600/80" style={{ opacity: 0.85 }}>
                  <p className="text-white text-sm leading-relaxed break-words">{pendingText}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <Clock size={10} className="text-gray-300" />
                    <span className="text-gray-300 text-xs">Pending</span>
                  </div>
                </div>
              </div>
            )}
            {/* Incoming request bubble (the text they sent) */}
            {chatStatus === 'INCOMING_PENDING' && incomingRequest?.text && (
              <div className="flex justify-start mb-2 px-4">
                <div className="max-w-xs lg:max-w-md rounded-2xl rounded-bl-sm px-4 py-2 bg-indigo-700/80">
                  <p className="text-white text-sm leading-relaxed break-words">{incomingRequest.text}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Accept/Decline for incoming requests */}
          {chatStatus === 'INCOMING_PENDING' && (
            <div className="whatsapp-header px-4 py-3 border-l border-gray-800">
              {!incomingRequest?.requestId && (
                <p className="text-gray-400 text-xs text-center mb-2">Loading request…</p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  disabled={!incomingRequest?.requestId}
                  onClick={async () => {
                    try {
                      const token = await getAuthToken();
                      await fetch(`${getBase()}/messages/requests/${incomingRequest.requestId}/accept`, {
                        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      });
                      setChatStatus('ACCEPTED');
                      setIncomingRequest(null);
                      fetchInbox();
                    } catch { setSendError('Failed to accept request.'); }
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', borderRadius: 10, border: 'none', cursor: incomingRequest?.requestId ? 'pointer' : 'not-allowed',
                    background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 600, fontSize: 14,
                    opacity: incomingRequest?.requestId ? 1 : 0.5,
                  }}
                >
                  <UserCheck size={16} /> Accept
                </button>
                <button
                  disabled={!incomingRequest?.requestId}
                  onClick={async () => {
                    try {
                      const token = await getAuthToken();
                      await fetch(`${getBase()}/messages/requests/${incomingRequest.requestId}/decline`, {
                        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      });
                      setChatStatus('NONE');
                      setIncomingRequest(null);
                    } catch { setSendError('Failed to decline request.'); }
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)',
                    cursor: incomingRequest?.requestId ? 'pointer' : 'not-allowed',
                    background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: 14,
                    opacity: incomingRequest?.requestId ? 1 : 0.5,
                  }}
                >
                  <UserX size={16} /> Decline
                </button>
              </div>
            </div>
          )}

          <div className="whatsapp-header p-3 border-l border-gray-800 safe-area-bottom">
            {sendError && (
              <div className="mb-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2">
                {sendError}
              </div>
            )}
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-700/50 border-l-2 border-blue-400 px-3 py-2">
                <CornerUpLeft className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-300 mb-0.5">
                    {replyTo.sender_id === (user?.id || user?._id) ? (user?.name || 'You') : (selectedUser?.name || 'Them')}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-gray-600 text-gray-400 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {chatStatus === 'BLOCKED' ? (
              <div className="text-center py-3">
                <div className="flex items-center justify-center gap-2">
                  <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 500 }}>You blocked this contact.</span>
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>Open their profile to unblock.</span>
                </div>
              </div>
            ) : (chatStatus === 'OUTGOING_PENDING' || chatStatus === 'INCOMING_PENDING') ? (
              <div className="text-center py-3">
                {chatStatus === 'OUTGOING_PENDING' && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock size={16} color="#818cf8" />
                    <span style={{ color: '#818cf8', fontSize: 14, fontWeight: 500 }}>Message request sent — waiting for approval</span>
                  </div>
                )}
              </div>
            ) : isRecording ? (
              <div className="flex items-center gap-3">
                <button onClick={cancelRecording} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors touch-target" title="Cancel">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center gap-2 whatsapp-input rounded-lg px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-sm font-medium">
                    {String(Math.floor(recordingSeconds / 60)).padStart(2,'0')}:{String(recordingSeconds % 60).padStart(2,'0')}
                  </span>
                  <span className="text-gray-400 text-sm">Recording...</span>
                </div>
                <button onClick={stopRecording} className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors touch-target" title="Send voice note">
                  <Square className="w-5 h-5 fill-white" />
                </button>
              </div>
            ) : (
            <div className="flex items-center gap-2">
            <button className="hidden md:block p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target">
              <Smile className="w-6 h-6" />
            </button>
            <button
              onClick={() => messageImageInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target"
              title="Send image"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <button
              onClick={() => messageVideoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors touch-target disabled:opacity-50"
              title="Send video"
            >
              {uploadingVideo
                ? <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                : <Film className="w-5 h-5" />}
            </button>
            {uploadingVideo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                <span>{videoUploadProgress}%</span>
              </div>
            )}
            <div className="flex-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '10px 16px', backdropFilter: 'blur(10px)' }}>
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  try {
                    const socket = socketService.socket;
                    if (socket && selectedUser) {
                      const recipientId = selectedUser.id || selectedUser._id;
                      socket.emit('typing_user', {
                        recipient_id: recipientId,
                        sender_id: user?.id || user?._id,
                        is_typing: true
                      });
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        try {
                          socket.emit('typing_user', {
                            recipient_id: recipientId,
                            sender_id: user?.id || user?._id,
                            is_typing: false
                          });
                        } catch {}
                      }, 1500);
                    }
                  } catch {}
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message"
                className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-sm md:text-base"
              />
            </div>
            {message.trim() ? (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="p-2 rounded-full text-white transition-colors touch-target disabled:opacity-50" style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 0 14px rgba(168,85,247,0.45)'}}
              >
                {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={uploadingVoice}
                className="p-2 rounded-full text-white transition-colors touch-target disabled:opacity-50" style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 0 14px rgba(168,85,247,0.45)'}}
                title="Record voice note"
              >
                {uploadingVoice ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            </div>
            )}
          </div>

          {/* Contact profile slide-in panel */}
          {showContactProfile && selectedUser && (
            <ContactProfilePanel
              participant={{
                id: selectedUser.id || selectedUser._id,
                name: selectedUser.name,
                username: selectedUser.username || '',
                avatar: selectedUser.avatar || '',
                status: (onlineUsers[selectedUser.id] || onlineUsers[selectedUser._id] || selectedUser.online) ? 'online' : 'offline',
              }}
              onClose={() => setShowContactProfile(false)}
              onBlockStatusChange={(status) => {
                setChatStatus(status === 'BLOCKED' ? 'BLOCKED' : 'ACCEPTED');
                if (status !== 'BLOCKED') setSendError('');
              }}
              onDelete={() => {
                const deletedId = selectedUser.id || selectedUser._id;
                setInbox(prev => prev.filter(c => c.sender_id !== deletedId && c.id !== deletedId));
                setSelectedUser(null);
                setShowContactProfile(false);
              }}
            />
          )}
          </>
        )}
      </div>

      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onSelectUser={handleUserSelect}
          resolveMediaUrl={resolveMediaUrl}
        />
      )}

      {forwardMsg && (
        <ForwardModal
          msg={forwardMsg}
          inbox={inbox}
          onClose={() => setForwardMsg(null)}
          onForward={handleForward}
          resolveMediaUrl={resolveMediaUrl}
        />
      )}

      <input
        ref={messageImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleSendImage(e.target.files?.[0])}
      />
      <input
        ref={messageVideoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { handleSendVideo(e.target.files?.[0]); }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
      />

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
            style={{ background: theme === 'light' ? '#ffffff' : '#1e293b' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: theme === 'light' ? '#1e293b' : '#f1f5f9' }}>
                  {!user?.phone_number ? 'Complete Your Profile' : 'Edit Profile'}
                </h2>
                {!user?.phone_number && (
                  <p className="text-xs mt-0.5" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
                    A phone number is required to use Pinglo.
                  </p>
                )}
              </div>
              {user?.phone_number && (
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }} />
                </button>
              )}
            </div>

            {/* Form */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                  style={{
                    background: theme === 'light' ? '#f8fafc' : '#0f172a',
                    border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                    color: theme === 'light' ? '#1e293b' : '#f1f5f9',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
                  Username
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none"
                    style={{ color: theme === 'light' ? '#94a3b8' : '#64748b' }}
                  >@</span>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="yourhandle"
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    style={{
                      background: theme === 'light' ? '#f8fafc' : '#0f172a',
                      border: usernameAvailable === true
                        ? '1px solid #10b981'
                        : usernameAvailable === false
                        ? '1px solid #ef4444'
                        : theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                      color: theme === 'light' ? '#1e293b' : '#f1f5f9',
                    }}
                  />
                  {usernameChecking && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">checking…</span>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-400">Available</span>
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">Taken</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm(f => ({ ...f, phone_number: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  autoFocus={!user?.phone_number}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                  style={{
                    background: theme === 'light' ? '#f8fafc' : '#0f172a',
                    border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                    color: theme === 'light' ? '#1e293b' : '#f1f5f9',
                  }}
                />
              </div>

              {/* Email Change */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-xs font-medium mb-1" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
                  Change Email
                </label>
                <p className="text-xs mb-2" style={{ color: theme === 'light' ? '#94a3b8' : '#64748b' }}>
                  Current: <span style={{ color: theme === 'light' ? '#1e293b' : '#f1f5f9' }}>{user?.email}</span>
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailChangeInput}
                    onChange={(e) => { setEmailChangeInput(e.target.value); setEmailChangeError(''); setEmailChangeMsg(''); setEmailChangeNeedsReauth(false); }}
                    placeholder="new@email.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    style={{
                      background: theme === 'light' ? '#f8fafc' : '#0f172a',
                      border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                      color: theme === 'light' ? '#1e293b' : '#f1f5f9',
                    }}
                  />
                  {!emailChangeNeedsReauth && (
                    <button
                      onClick={() => handleSendEmailChangeLink()}
                      disabled={emailChangeSending || !emailChangeInput.trim()}
                      className="px-3 py-2 text-xs font-medium rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {emailChangeSending ? 'Sending…' : 'Send link'}
                    </button>
                  )}
                </div>
                {emailChangeNeedsReauth && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      value={reauthPassword}
                      onChange={(e) => setReauthPassword(e.target.value)}
                      placeholder="Enter your password to confirm"
                      className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      style={{
                        background: theme === 'light' ? '#f8fafc' : '#0f172a',
                        border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                        color: theme === 'light' ? '#1e293b' : '#f1f5f9',
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && reauthPassword && handleSendEmailChangeLink(reauthPassword)}
                    />
                    <button
                      onClick={() => handleSendEmailChangeLink(reauthPassword)}
                      disabled={emailChangeSending || !reauthPassword}
                      className="px-3 py-2 text-xs font-medium rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {emailChangeSending ? 'Sending…' : 'Confirm'}
                    </button>
                  </div>
                )}
                {emailChangeError && <p className="text-xs text-red-400 mt-1">{emailChangeError}</p>}
                {emailChangeMsg && <p className="text-xs text-green-400 mt-1">{emailChangeMsg}</p>}
              </div>

              {profileError && (
                <p className="text-sm text-red-400">{profileError}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
              {user?.phone_number && (
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm rounded-xl transition-all hover:bg-gray-700/50"
                  style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleProfileSave}
                disabled={profileSaving || !profileForm.phone_number.trim()}
                className="px-5 py-2 text-sm font-medium rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all disabled:opacity-50"
              >
                {profileSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Popup — fixed so it's never clipped by overflow-hidden */}
      {showSettings && (
        <div
          data-settings-popup
          className="fixed z-[100] w-64 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
          style={{
            background: theme === 'light' ? '#ffffff' : '#1e293b',
            bottom: 16,
            left: 88,
          }}
        >
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
              Settings
            </p>
          </div>

          {/* Edit Profile */}
          <div className="px-4 py-2 border-b border-gray-700">
            <button
              onClick={openProfileModal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-700/50"
            >
              <User className="w-4 h-4" style={{ color: '#10b981' }} />
              <span className="text-sm font-medium" style={{ color: theme === 'light' ? '#1e293b' : '#f1f5f9' }}>
                Edit Profile
              </span>
            </button>
          </div>

          {/* Username */}
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
              Username
            </p>
            {usernameEditMode ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #334155', background: theme === 'light' ? '#f1f5f9' : '#0f172a' }}>
                  <span className="px-2 text-sm" style={{ color: '#94a3b8' }}>@</span>
                  <input
                    autoFocus
                    value={usernameEdit}
                    onChange={e => { setUsernameEdit(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')); setUsernameError(''); }}
                    placeholder="new username"
                    className="flex-1 py-1.5 pr-2 text-sm bg-transparent outline-none"
                    style={{ color: theme === 'light' ? '#1e293b' : '#f1f5f9' }}
                  />
                </div>
                {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (usernameEdit.length < 3) { setUsernameError('At least 3 characters'); return; }
                      setUsernameSaving(true);
                      try {
                        const token = await auth.currentUser?.getIdToken();
                        const res = await fetch(`${getBase()}/users/profile`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ username: usernameEdit }),
                        });
                        const data = await res.json();
                        if (!res.ok) { setUsernameError(data.error || 'Failed to save'); return; }
                        updateUser({ username: usernameEdit });
                        setUsernameEditMode(false);
                      } catch { setUsernameError('Network error'); }
                      finally { setUsernameSaving(false); }
                    }}
                    disabled={usernameSaving}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: '#10b981' }}
                  >
                    {usernameSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setUsernameEditMode(false); setUsernameError(''); }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: '#334155', color: '#94a3b8' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setUsernameEdit(user?.username || ''); setUsernameEditMode(true); setUsernameError(''); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-700/50 transition-all"
              >
                <span className="text-sm" style={{ color: theme === 'light' ? '#1e293b' : '#f1f5f9' }}>
                  {user?.username ? `@${user.username}` : 'Set username'}
                </span>
                <span className="text-xs font-medium" style={{ color: '#10b981' }}>Edit</span>
              </button>
            )}
          </div>

          {/* Privacy */}
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
              Privacy
            </p>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm" style={{ color: theme === 'light' ? '#1e293b' : '#f1f5f9' }}>Show last seen</span>
              <button
                onClick={async () => {
                  const next = !showLastSeen;
                  setShowLastSeen(next);
                  try {
                    const token = await auth.currentUser?.getIdToken();
                    await fetch(`${getBase()}/users/profile`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ show_last_seen: next }),
                    });
                    updateUser({ show_last_seen: next });
                  } catch { setShowLastSeen(!next); }
                }}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: showLastSeen ? '#10b981' : '#4b5563',
                  position: 'relative', transition: 'background 0.2s',
                }}
                aria-label="Toggle last seen"
              >
                <span style={{
                  position: 'absolute', top: 3, left: showLastSeen ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="px-4 py-3">
            <p className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
              Theme
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('dark')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: theme === 'dark' ? '1px solid rgba(59,130,246,0.4)' : '1px solid #334155',
                  color: theme === 'dark' ? '#60a5fa' : '#94a3b8',
                }}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: theme === 'light' ? 'rgba(251,191,36,0.1)' : 'transparent',
                  border: theme === 'light' ? '1px solid rgba(251,191,36,0.4)' : '1px solid #334155',
                  color: theme === 'light' ? '#f59e0b' : '#94a3b8',
                }}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CallManager — always mounted so calls survive navigation */}
      <CallManager
        ref={callManagerRef}
        currentUser={user}
        selectedUser={selectedUser}
      />

      {/* Group / conference call manager */}
      <GroupCallManager
        ref={groupCallManagerRef}
        currentUser={user}
        contacts={inbox
          .filter(c => c.sender_id && c.sender_id !== 'None' && c.sender_id !== 'null')
          .map(c => ({ id: c.sender_id, name: c.sender_name, avatar: c.sender_avatar || '', username: c.sender_username }))}
      />
    </div>
  );
};

export default WhatsAppMessenger;
