import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { messagesAPI, messageRequestsAPI } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

// Chat Context
const ChatContext = createContext();

// Initial state
const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {},
  onlineUsers: [],
  loading: false,
  messagesLoading: false,
};

// Chat reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_MESSAGES_LOADING':
      return { ...state, messagesLoading: action.payload };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations]
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? { ...conv, ...action.payload } : conv
        )
      };
    
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload, messages: [] };
    
    case 'SET_MESSAGES':
      return { ...state, messages: (action.payload || []).filter(Boolean) };

    case 'ADD_MESSAGE': {
      if (!action.payload) return state;
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (exists) return state;
      return { ...state, messages: [...state.messages, action.payload] };
    }

    case 'PREPEND_MESSAGES':
      return {
        ...state,
        messages: [...(action.payload || []).filter(Boolean), ...state.messages]
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg => {
          // Replace temp message with real one from server
          if (msg.id.toString().startsWith('temp-') && 
              msg.content === action.payload.content &&
              msg.sender_id === action.payload.sender_id) {
            return action.payload;
          }
          // Update existing message by ID
          if (msg.id === action.payload.id) {
            return { ...msg, ...action.payload };
          }
          return msg;
        })
      };
    
    case 'SET_TYPING_USERS':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: {
            ...state.typingUsers[action.payload.conversationId],
            [action.payload.userId]: action.payload.isTyping
          }
        }
      };
    
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    
    case 'UPDATE_USER_STATUS':
      return {
        ...state,
        onlineUsers: state.onlineUsers.map(user =>
          user.id === action.payload.userId
            ? { ...user, status: action.payload.status }
            : user
        )
      };

    case 'REPLACE_TEMP_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.tempId ? action.payload.realMessage : msg
        )
      };

    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(m => m.id !== action.payload)
      };

    default:
      return state;
  }
};

// Chat Provider Component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  
  // Use ref to track conversations so socket listeners always see latest value
  const conversationsRef = useRef([]);
  
  // Update ref whenever conversations change
  useEffect(() => {
    conversationsRef.current = state.conversations;
  }, [state.conversations]);

  // Load conversations on mount and cleanup on logout
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      setupSocketListeners();
    } else {
      // Clear state on logout
      dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
      dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated]);

  // Setup socket event listeners
  const setupSocketListeners = () => {
    // WhatsApp-style: conversation:update event
    // Updates conversation list when new messages arrive
    socketService.onConversationUpdate((update) => {
      console.log('🔄 Conversation update:', update);
      
      const updatedConv = {
        id: update.id,
        last_message: { content: update.last_message },
        last_message_time: update.last_message_time,
        updated_at: update.updated_at
      };
      
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConv });
      
      // Also reload full conversations to get accurate unread counts
      loadConversations();
    });

    // New message received (from other users)
    socketService.onNewMessage((message) => {
      console.log('📨 Received new message:', message);
      
      // Add message to state - reducer will check for duplicates
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      // Check if conversation exists in state using ref (always current)
      const conversationExists = conversationsRef.current.some(
        conv => conv.id === message.conversation_id
      );
      
      if (!conversationExists) {
        // New conversation - reload all conversations to get it
        console.log('📬 New conversation detected, reloading...');
        loadConversations();
      }
    });

    // User status changes
    socketService.onUserStatus(({ user_id, status }) => {
      dispatch({ 
        type: 'UPDATE_USER_STATUS', 
        payload: { userId: user_id, status }
      });
    });

    // Typing indicators
    socketService.onUserTyping(({ conversation_id, user_id, is_typing }) => {
      dispatch({
        type: 'SET_TYPING_USERS',
        payload: {
          conversationId: conversation_id,
          userId: user_id,
          isTyping: is_typing
        }
      });
    });

    // Message sent confirmation - replace optimistic message with real one
    socketService.onMessageSent((message) => {
      console.log('✅ Message confirmed:', message);
      dispatch({ type: 'UPDATE_MESSAGE', payload: message });
      
      // Check if conversation exists in state using ref (always current)
      const conversationExists = conversationsRef.current.some(
        conv => conv.id === message.conversation_id
      );
      
      if (conversationExists) {
        // Update existing conversation's last message
        const updatedConv = {
          id: message.conversation_id,
          last_message: { content: message.content },
          updated_at: message.timestamp
        };
        dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConv });
      } else {
        // New conversation - reload all conversations to get it
        console.log('📬 New conversation created, reloading...');
        loadConversations();
      }
    });

    // Messages read
    socketService.onMessagesRead(({ conversation_id, reader_id }) => {
      if (state.activeConversation?.id === conversation_id) {
        // Mark messages as read
        const updatedMessages = state.messages.map(msg =>
          msg.sender_id !== reader_id ? { ...msg, read: true } : msg
        );
        dispatch({ type: 'SET_MESSAGES', payload: updatedMessages });
      }
    });

    // Socket errors
    socketService.onError((error) => {
      console.error('Socket error:', error);
    });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await messagesAPI.getConversations();
      const conversations = response.data.conversations || [];
      console.log(`Loaded ${conversations.length} conversations:`, conversations);
      
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
    } catch (error) {
      console.error('Error loading conversations:', error);
      dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Set active conversation and load messages
  const setActiveConversation = async (conversation) => {
    if (state.activeConversation?.id) {
      socketService.leaveConversation(state.activeConversation.id);
    }

    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation });
    
    if (conversation) {
      socketService.joinConversation(conversation.id);
      await loadMessages(conversation.id);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId, page = 1) => {
    try {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
      
      const response = await messagesAPI.getMessages(conversationId, page);
      const messages = response.data.messages || [];
      
      if (page === 1) {
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      } else {
        dispatch({ type: 'PREPEND_MESSAGES', payload: messages });
      }
      
      // Mark messages as read
      if (user) {
        socketService.markAsRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    } finally {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
    }
  };

  // Send message
  const sendMessage = async (content, messageType = 'text', replyToId = null, replyToContent = null, replyToSenderName = null) => {
    if (!state.activeConversation || !user) return;

    // Media messages have URL content — only require non-empty, not trimmable space
    if (!content || (messageType === 'text' && !content.trim())) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: state.activeConversation._id || state.activeConversation.id,
      content: content.trim(),
      message_type: messageType,
      sender_id: user._id || user.id,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    try {
      dispatch({ type: 'ADD_MESSAGE', payload: optimisticMessage });

      const receiverUsername = state.activeConversation.participant?.username;
      const conversationId = state.activeConversation._id || state.activeConversation.id;

      const response = await messagesAPI.sendMessage(
        receiverUsername, content.trim(), conversationId,
        replyToId, replyToContent, replyToSenderName,
        messageType
      );

      if (response.status === 201 && response.data?.status === 'pending_request') {
        dispatch({ type: 'SET_MESSAGES', payload: state.messages.filter(m => m.id !== optimisticMessage.id) });
        return { pending: true, text: content.trim(), requestId: response.data.request_id };
      }

      const realMessage = { ...(response.data?.message || response.data), message_type: messageType };
      dispatch({ type: 'UPDATE_MESSAGE', payload: { ...optimisticMessage, ...realMessage, status: 'sent' } });

      socketService.sendMessage({
        conversation_id: conversationId,
        text: content.trim(),
        sender_id: user._id || user.id,
        message_type: messageType,
      });

      return { pending: false };

    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch({ type: 'SET_MESSAGES', payload: state.messages.filter(m => m.id !== optimisticMessage.id) });
      return { pending: false };
    }
  };

  // Add an optimistic image bubble immediately (returns tempId)
  const addOptimisticImageMessage = (blobUrl) => {
    const tempId = `temp-img-${Date.now()}`;
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: tempId,
        conversation_id: state.activeConversation?._id || state.activeConversation?.id,
        content: blobUrl,
        message_type: 'image',
        sender_id: user?._id || user?.id,
        timestamp: new Date().toISOString(),
        status: 'sending',
      },
    });
    return tempId;
  };

  // Persist image message to server then swap the temp bubble with the real one
  const sendImageMessage = async (tempId, imageUrl, replyToId = null, replyToContent = null, replyToSenderName = null) => {
    const conversationId = state.activeConversation?._id || state.activeConversation?.id;
    const receiverUsername = state.activeConversation?.participant?.username;
    try {
      const response = await messagesAPI.sendMessage(
        receiverUsername, imageUrl, conversationId, replyToId, replyToContent, replyToSenderName, 'image'
      );
      const realMessage = { ...(response.data?.message || response.data), message_type: 'image' };
      dispatch({ type: 'REPLACE_TEMP_MESSAGE', payload: { tempId, realMessage } });
      socketService.sendMessage({
        conversation_id: conversationId,
        text: imageUrl,
        sender_id: user?._id || user?.id,
        message_type: 'image',
      });
    } catch {
      dispatch({ type: 'REMOVE_MESSAGE', payload: tempId });
    }
  };

  // Add an optimistic video bubble immediately (shows local blob while uploading)
  const addOptimisticVideoMessage = (blobUrl) => {
    const tempId = `temp-vid-${Date.now()}`;
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: tempId,
        conversation_id: state.activeConversation?._id || state.activeConversation?.id,
        content: blobUrl,
        message_type: 'video',
        sender_id: user?._id || user?.id,
        timestamp: new Date().toISOString(),
        status: 'sending',
      },
    });
    return tempId;
  };

  // Swap the optimistic video bubble with the real server URL
  const sendVideoMessage = async (tempId, videoUrl, replyToId = null, replyToContent = null, replyToSenderName = null) => {
    const conversationId = state.activeConversation?._id || state.activeConversation?.id;
    const receiverUsername = state.activeConversation?.participant?.username;
    try {
      const response = await messagesAPI.sendMessage(
        receiverUsername, videoUrl, conversationId, replyToId, replyToContent, replyToSenderName, 'video'
      );
      const realMessage = { ...(response.data?.message || response.data), message_type: 'video' };
      dispatch({ type: 'REPLACE_TEMP_MESSAGE', payload: { tempId, realMessage } });
      socketService.sendMessage({
        conversation_id: conversationId,
        text: videoUrl,
        sender_id: user?._id || user?.id,
        message_type: 'video',
      });
    } catch {
      dispatch({ type: 'REMOVE_MESSAGE', payload: tempId });
    }
  };

  // Send typing indicator
  const sendTyping = (isTyping) => {
    if (state.activeConversation && user) {
      socketService.sendTyping(state.activeConversation.id, user.id, isTyping);
    }
  };

  // Create new conversation
  const createConversation = async (otherUserId) => {
    try {
      console.log('Creating conversation with user:', otherUserId);
      const response = await messagesAPI.createConversation(otherUserId);
      const conversation = response.data.conversation;
      console.log('Conversation created:', conversation);
      
      // Add to state immediately if it's a new conversation (status 201)
      if (response.status === 201) {
        console.log('New conversation - adding to state');
        dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
      }
      
      // Also refresh conversations to ensure we have latest data
      await loadConversations();
      
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const getRelationshipStatus = async (userId) => {
    try {
      const response = await messagesAPI.getChatStatus(userId);
      return response.data; // { status, request_id?, text?, sender_id? }
    } catch (error) {
      console.error('❌ Failed to get relationship status:', error);
      return { status: 'NONE' };
    }
  };

  const getMessageRequests = async () => {
    try {
      const response = await messageRequestsAPI.getRequests();
      return response.data.requests || [];
    } catch (error) {
      console.error('❌ Failed to get message requests:', error);
      return [];
    }
  };

  const acceptMessageRequest = async (requestId) => {
    try {
      const response = await messageRequestsAPI.accept(requestId);
      await loadConversations();
      return response.data;
    } catch (error) {
      console.error('❌ Failed to accept message request:', error);
      throw error;
    }
  };

  const declineMessageRequest = async (requestId) => {
    try {
      const response = await messageRequestsAPI.decline(requestId);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to decline message request:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    setActiveConversation,
    loadMessages,
    sendMessage,
    sendImageMessage,
    addOptimisticImageMessage,
    addOptimisticVideoMessage,
    sendVideoMessage,
    sendTyping,
    createConversation,
    loadConversations,
    // Message request functions
    getRelationshipStatus,
    getMessageRequests,
    acceptMessageRequest,
    declineMessageRequest,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};