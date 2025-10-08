import { createContext, useContext, useReducer, useEffect } from 'react';
import { messagesAPI } from '../services/api';
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

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      setupSocketListeners();
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated]);

  // Setup socket event listeners
  const setupSocketListeners = () => {
    // New message received
    socketService.onNewMessage((message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      // Update conversation's last message
      const updatedConv = {
        id: message.conversation_id,
        last_message: message,
        updated_at: message.timestamp
      };
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConv });
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

  // Load conversations
  const loadConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await messagesAPI.getConversations();
      dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.conversations });
    } catch (error) {
      console.error('Error loading conversations:', error);
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
      
      if (page === 1) {
        dispatch({ type: 'SET_MESSAGES', payload: response.data.messages });
      } else {
        dispatch({ type: 'PREPEND_MESSAGES', payload: response.data.messages });
      }
      
      // Mark messages as read
      if (user) {
        socketService.markAsRead(conversationId, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
    }
  };

  // Send message
  const sendMessage = async (content, messageType = 'text') => {
    if (!state.activeConversation || !user || !content.trim()) return;

    const messageData = {
      conversation_id: state.activeConversation.id,
      content: content.trim(),
      sender_id: user.id,
      message_type: messageType
    };

    socketService.sendMessage(messageData);
  };

  // Send typing indicator
  const sendTyping = (isTyping) => {
    if (state.activeConversation && user) {
      socketService.sendTyping(state.activeConversation.id, user.id, isTyping);
    }
  };

  // Create new conversation
  const createConversation = async (participantId) => {
    try {
      const response = await messagesAPI.createConversation(participantId);
      const conversation = response.data.conversation;
      
      // Check if conversation already exists in state
      const existingConv = state.conversations.find(c => c.id === conversation.id);
      if (!existingConv) {
        dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
      }
      
      return conversation;
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