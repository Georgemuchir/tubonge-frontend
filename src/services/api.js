import axios from 'axios';
import { auth } from '../firebase';

const normalizeApiBaseUrl = (url) => {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5000/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase ID token to requests (auto-refreshes when expired)
api.interceptors.request.use(async (config) => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    const token = await firebaseUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Do not redirect; let the UI handle the error
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  acknowledgeReset: () => api.post('/auth/acknowledge-reset'),
};

// Users API
export const usersAPI = {
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updateEmail: (email) => api.put('/users/update-email', { email }),
  requestEmailChange: (newEmail) => api.post('/users/request-email-change', { new_email: newEmail }),
  confirmEmailChange: (token) => api.post('/users/confirm-email-change', { token }),
  getOnlineUsers: () => api.get('/users/online'),
};

// Friend Requests API (NEW - STRICT PERMISSION MODEL)
export const friendsAPI = {
  // Search user by exact username
  searchUser: (username) => api.get(`/users/search?q=${username}`),
  
  // Send friend request
  sendRequest: (username) => api.post('/friends/send', { username }),
  
  // Get incoming friend requests
  getIncomingRequests: () => api.get('/friends/incoming'),
  
  // Accept friend request
  acceptRequest: (requestId) => api.post('/friends/accept', { requestId }),
  
  // Get relationship status with a user
  getRelationshipStatus: (username) => api.get(`/friends/status?username=${username}`),
  
  // Get all friends
  getFriends: () => api.get('/friends/list'),
};

// Messages API (UPDATED - STRICT PERMISSION MODEL)
export const messagesAPI = {
    // Upload image for chat
    uploadImage: (file) => {
      const formData = new FormData();
      formData.append('image', file);
      return api.post('/messages/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    // Upload voice note for chat
    uploadVoice: (blob) => {
      const formData = new FormData();
      formData.append('voice', blob, 'voice.webm');
      return api.post('/messages/upload-voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

  // Get all conversations (inbox)
  getConversations: () => api.get('/messages/inbox'),

  // Get messages for a conversation
  getMessages: (conversationId, page = 1, limit = 50) =>
    api.get(`/messages/${conversationId}?page=${page}&limit=${limit}`),

  // Send message (STRICT: requires friendship)
  sendMessage: (receiverUsername, text, conversationId = null, replyToId = null, replyToContent = null, replyToSenderName = null) => {
    const payload = { text };
    if (conversationId) {
      payload.conversationId = conversationId;
    } else {
      payload.receiverUsername = receiverUsername;
    }
    if (replyToId) {
      payload.reply_to_id = replyToId;
      payload.reply_to_content = replyToContent || '';
      payload.reply_to_sender_name = replyToSenderName || '';
    }
    return api.post('/messages/send', payload);
  },

  // Mark messages as read
  markAsRead: (conversationId) =>
    api.post(`/messages/${conversationId}/mark-read`),

  getChatStatus: (userId) => api.get('/messages/chat-status/' + userId),
};

export const messageRequestsAPI = {
  getRequests: () => api.get('/messages/requests'),
  accept: (requestId) => api.post(`/messages/requests/${requestId}/accept`),
  decline: (requestId) => api.post(`/messages/requests/${requestId}/decline`),
};

export default api;