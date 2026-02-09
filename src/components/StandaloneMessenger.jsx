import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, Plus, Phone, Video, Info, Paperclip, Smile, Sparkles, Mail, Lock, User, Check, X, Menu, ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .blob {
    animation: blob 7s infinite;
  }
  
  .float-animation {
    animation: float 3s ease-in-out infinite;
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .message-sent {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
  }
  
  .message-received {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
  }
  
  .hover-lift {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 3px;
  }
  
  .slide-in-left {
    animation: slideInLeft 0.3s ease-out;
  }
  
  .slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
  
  /* Safe area for mobile devices with notches */
  .safe-area-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
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
    
    /* Larger touch targets for mobile */
    .touch-target {
      min-height: 48px;
      min-width: 48px;
    }
    
    /* Prevent text selection on double-tap */
    .touch-target {
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
  }
`;

export { default } from './legacy/StandaloneMessenger';
  const [searchQuery, setSearchQuery] = useState('');
