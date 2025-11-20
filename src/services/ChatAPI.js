// Chat API service for backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ChatAPI {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setAuthToken(token) {
    this.token = token;
  }

  // Get authentication headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // Handle API responses
  async handleResponse(response) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
  }

  // ================================
  // CONTACT MANAGEMENT
  // ================================

  // Get user's contacts/conversations
  async getContacts() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        headers: this.getHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Get contacts error:', error);
      return [];
    }
  }

  // Search users by email
  async searchUsers(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?email=${encodeURIComponent(email)}`, {
        headers: this.getHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  // Add a new contact
  async addContact(contactId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ contactId })
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Add contact error:', error);
      throw error;
    }
  }

  // ================================
  // MESSAGING
  // ================================

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
        headers: this.getHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(conversationId, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content })
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // ================================
  // WEBSOCKET PLACEHOLDER
  // ================================

  // Initialize WebSocket connection
  initializeWebSocket(userId, onMessage, onStatusUpdate) {
    console.log('WebSocket initialization for user:', userId);
    
    this.userId = userId;
    this.onMessage = onMessage;
    this.onStatusUpdate = onStatusUpdate;
    
    // Store socket object
    this.socket = {
      connected: false,
      emit: (event, data) => console.log('Socket emit:', event, data),
      disconnect: () => console.log('Socket disconnect')
    };

    return this.socket;
  }

  // Close WebSocket connection
  closeWebSocket() {
    if (this.socket && this.socket.disconnect) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send typing indicator
  sendTypingIndicator(conversationId, isTyping) {
    if (this.socket && this.socket.emit && this.userId) {
      this.socket.emit('typing', {
        conversation_id: conversationId,
        user_id: this.userId,
        is_typing: isTyping
      });
    }
  }
}

export default new ChatAPI();
