import { createContext, useContext, useReducer, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import ChatAPI from '../services/ChatAPI';
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
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'PREPEND_MESSAGES':
      return {
        ...state,
        messages: [...action.payload, ...state.messages]
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        )
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
    
    default:
      return state;
  }
};

// Chat Provider Component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load conversations on mount and cleanup on logout
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      setupSocketListeners();
    } else {
      // Clear cache and state on logout
      ChatAPI.clearCache();
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
    // New message received (from other users)
    socketService.onNewMessage((message) => {
      const formattedMessage = ChatAPI.formatMessage(message);
      dispatch({ type: 'ADD_MESSAGE', payload: formattedMessage });
      
      // Add to cache for persistence
      ChatAPI.addMessageToCache(message.conversation_id, formattedMessage);
      
      // Update conversation's last message
      const updatedConv = {
        id: message.conversation_id,
        lastMessage: message.content,
        lastMessageTime: message.timestamp,
        updatedAt: message.timestamp
      };
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConv });
      ChatAPI.updateConversation(message.conversation_id, updatedConv);
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

    // Message sent confirmation
    socketService.onMessageSent((message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
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

  // Load conversations with persistent data
  const loadConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const conversations = await ChatAPI.loadConversations();
      
      // Format conversations for display
      const formattedConversations = conversations.map(conv => 
        ChatAPI.formatConversation(conv)
      );
      
      dispatch({ type: 'SET_CONVERSATIONS', payload: formattedConversations });
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

  // Load messages for a conversation with persistence
  const loadMessages = async (conversationId, page = 1) => {
    try {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
      
      // Load messages from persistent storage
      const messages = await ChatAPI.loadMessages(conversationId, page);
      
      // Format messages for display
      const formattedMessages = messages.map(msg => ChatAPI.formatMessage(msg));
      
      if (page === 1) {
        dispatch({ type: 'SET_MESSAGES', payload: formattedMessages });
      } else {
        dispatch({ type: 'PREPEND_MESSAGES', payload: formattedMessages });
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

  // Send message with persistence
  const sendMessage = async (content, messageType = 'text') => {
    if (!state.activeConversation || !user || !content.trim()) return;

    try {
      // Send via API for persistence
      const message = await ChatAPI.sendMessage(
        state.activeConversation.id, 
        content.trim(), 
        messageType
      );

      // Format and add to local state
      const formattedMessage = ChatAPI.formatMessage(message);
      dispatch({ type: 'ADD_MESSAGE', payload: formattedMessage });

      // Also send via socket for real-time updates to other users
      const socketData = {
        conversation_id: state.activeConversation.id,
        content: content.trim(),
        sender_id: user.id,
        message_type: messageType
      };
      socketService.sendMessage(socketData);

      // Update conversation last message
      ChatAPI.updateConversation(state.activeConversation.id, {
        last_message: content.trim(),
        last_message_time: formattedMessage.timestamp,
        updated_at: formattedMessage.timestamp
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      // Optionally show error message to user
    }
  };

  // Send typing indicator
  const sendTyping = (isTyping) => {
    if (state.activeConversation && user) {
      socketService.sendTyping(state.activeConversation.id, user.id, isTyping);
    }
  };

  // Create new conversation with persistence
  const createConversation = async (otherUserId) => {
    try {
      const conversation = await ChatAPI.createConversation(otherUserId);
      const formattedConversation = ChatAPI.formatConversation(conversation);
      
      // Check if conversation already exists in state
      const existingConv = state.conversations.find(c => c.id === formattedConversation.id);
      if (!existingConv) {
        dispatch({ type: 'ADD_CONVERSATION', payload: formattedConversation });
      }
      
      return formattedConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    setActiveConversation,
    loadMessages,
    sendMessage,
    sendTyping,
    createConversation,
    loadConversations,
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