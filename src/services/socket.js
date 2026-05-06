import { io } from 'socket.io-client';
import { serverReady, getActiveSocketUrl, onServerSwitch, hasLocalServer } from './serverConfig';

const TRANSPORTS = (import.meta.env.VITE_SOCKET_TRANSPORTS || 'websocket,polling')
  .split(',')
  .map((t) => t.trim())
  .filter((x) => ['websocket', 'polling'].includes(x));
const transports = TRANSPORTS.length ? TRANSPORTS : ['websocket', 'polling'];

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this._token = null;
    this._consecutiveErrors = 0;
    this._switchUnsub = null;
  }

  async connect(token) {
    this._token = token;
    if (this.socket?.connected) return;

    await serverReady;
    this._connectToUrl(getActiveSocketUrl(), token);

    // Reconnect when serverConfig switches servers (e.g. primary recovered)
    this._switchUnsub?.();
    this._switchUnsub = onServerSwitch(() => {
      const newUrl = getActiveSocketUrl();
      if (this.socket && this._currentUrl !== newUrl) {
        console.info('[socket] Server switched — reconnecting to', newUrl);
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
        this._connectToUrl(newUrl, this._token);
      }
    });
  }

  _connectToUrl(url, token) {
    this._currentUrl = url;
    this._consecutiveErrors = 0;

    this.socket = io(url, {
      path: '/socket.io',
      auth: { token },
      transports,
      withCredentials: false,
      // Only limit reconnection attempts when a fallback server exists.
      // With no fallback, let Socket.IO retry forever (original behaviour).
      ...(hasLocalServer ? { reconnectionAttempts: 5 } : {}),
    });

    this.socket.on('connect', () => {
      console.warn('[socket] connected via:', this.socket.io.engine.transport.name);
      this.connected = true;
      this._consecutiveErrors = 0;
    });

    this.socket.io.on('upgrade', () => {
      console.warn('[socket] upgraded to:', this.socket.io.engine.transport.name);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[socket] connection error:', error.message);
      this._consecutiveErrors += 1;
    });

    // All reconnection attempts exhausted — try the other server
    this.socket.io.on('reconnect_failed', async () => {
      console.warn('[socket] Reconnection failed — checking for fallback');
      await serverReady;
      const fallbackUrl = getActiveSocketUrl();
      if (fallbackUrl !== this._currentUrl) {
        console.info('[socket] Switching to fallback:', fallbackUrl);
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
        this._connectToUrl(fallbackUrl, this._token);
      }
    });
  }

  disconnect() {
    this._switchUnsub?.();
    this._switchUnsub = null;
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

  // ── WebRTC Call Signaling ──

  callUser(callerId, calleeId, signalData, callType = 'video') {
    console.log('[SOCKET] callUser:', { callerId, calleeId, callType, connected: this.socket?.connected });
    if (this.socket?.connected) {
      this.socket.emit('call_user', {
        caller_id: callerId,
        callee_id: calleeId,
        signal_data: signalData,
        call_type: callType
      });
    } else {
      console.error('[SOCKET] Cannot call — socket not connected!');
    }
  }

  acceptCall(callerId, calleeId, signalData) {
    if (this.socket?.connected) {
      this.socket.emit('call_accepted', {
        caller_id: callerId,
        callee_id: calleeId,
        signal_data: signalData
      });
    }
  }

  rejectCall(callerId, calleeId) {
    if (this.socket?.connected) {
      this.socket.emit('call_rejected', {
        caller_id: callerId,
        callee_id: calleeId
      });
    }
  }

  endCall(callerId, calleeId, endedBy) {
    if (this.socket?.connected) {
      this.socket.emit('call_ended', {
        caller_id: callerId,
        callee_id: calleeId,
        ended_by: endedBy
      });
    }
  }

  sendIceCandidate(targetId, fromId, candidate) {
    if (this.socket?.connected) {
      this.socket.emit('ice_candidate', {
        target_id: targetId,
        from_id: fromId,
        candidate: candidate
      });
    }
  }

  missedCall(callerId, calleeId, callType = 'video') {
    console.log('[SOCKET] missedCall:', { callerId, calleeId, callType });
    if (this.socket?.connected) {
      this.socket.emit('missed_call', {
        caller_id: callerId,
        callee_id: calleeId,
        call_type: callType
      });
    }
  }

  onIncomingCall(callback) {
    if (this.socket) {
      this.socket.on('incoming_call', callback);
    }
  }

  onCallAccepted(callback) {
    if (this.socket) {
      this.socket.on('call_accepted', callback);
    }
  }

  onCallRejected(callback) {
    if (this.socket) {
      this.socket.on('call_rejected', callback);
    }
  }

  onCallEnded(callback) {
    if (this.socket) {
      this.socket.on('call_ended', callback);
    }
  }

  onCallUnavailable(callback) {
    if (this.socket) {
      this.socket.on('call_unavailable', callback);
    }
  }

  onIceCandidate(callback) {
    if (this.socket) {
      this.socket.on('ice_candidate', callback);
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
      // WhatsApp-style event (alias)
      this.socket.on('message:new', callback);
    }
  }

  // WhatsApp-style: conversation list updates
  onConversationUpdate(callback) {
    if (this.socket) {
      this.socket.on('conversation:update', callback);
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

  onMessageRequest(callback) {
    if (this.socket) this.socket.on('message_request', callback);
  }

  onRequestAccepted(callback) {
    if (this.socket) this.socket.on('request_accepted', callback);
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