import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    // Parse transports: default to websocket,polling for prod-like behavior
    const parsed = (import.meta.env.VITE_SOCKET_TRANSPORTS || 'websocket,polling')
      .split(',')
      .map((t) => t.trim())
      .filter((x) => ['websocket', 'polling'].includes(x));
    const transports = parsed.length ? parsed : ['websocket', 'polling'];

    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports,
      withCredentials: false
    });

    // Log effective transport after connect
    this.socket.on('connect', () => {
      console.warn('[socket] connected via:', this.socket.io.engine.transport.name);
      this.connected = true;
    });

    // Log upgrade to WebSocket
    this.socket.io.on('upgrade', () => {
      console.warn('[socket] upgraded to:', this.socket.io.engine.transport.name);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Message events
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversation_id: conversationId });
    }
  }

  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversation_id: conversationId });
    }
  }

  sendMessage(messageData) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', messageData);
    }
  }

  // Typing events
  sendTyping(conversationId, userId, isTyping) {
    if (this.socket?.connected) {
      this.socket.emit('typing', {
        conversation_id: conversationId,
        user_id: userId,
        is_typing: isTyping
      });
    }
  }

  // Read receipts
  markAsRead(conversationId, userId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', {
        conversation_id: conversationId,
        user_id: userId
      });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('user_status', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages_read', callback);
    }
  }

  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('message_sent', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Admin enforcement
  onForceLogout(callback) {
    if (this.socket) {
      this.socket.on('force_logout', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;