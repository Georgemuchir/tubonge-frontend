import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import socketService from '../services/socket';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload.user, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // Prevents onAuthStateChanged from conflicting with active login/register calls
  const authFlowInProgress = useRef(false);

  // Listen to Firebase auth state — handles session restore on page load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If login/register is actively running, let it manage state itself
      if (authFlowInProgress.current) return;

      if (firebaseUser) {
        try {
          const response = await authAPI.getProfile();
          const user = response.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          dispatch({ type: 'LOGIN', payload: { user } });
          socketService.connect(await firebaseUser.getIdToken());
        } catch {
          // Backend profile fetch failed — sign out Firebase session too
          await signOut(auth);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        localStorage.removeItem('user');
        socketService.disconnect();
        dispatch({ type: 'LOGOUT' });
      }
    });
    return unsubscribe;
  }, []);

  // Subscribe to force logout socket events
  useEffect(() => {
    if (state.isAuthenticated && socketService.socket) {
      const handler = () => {
        signOut(auth);
      };
      socketService.onForceLogout(handler);
      return () => socketService.off('force_logout', handler);
    }
  }, [state.isAuthenticated]);

  const register = async (userData) => {
    authFlowInProgress.current = true;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { name, username, email, password } = userData;

      // 1. Create Firebase Auth user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(firebaseUser, { displayName: name });

      // 2. Create backend profile (token sent automatically by api.js interceptor)
      const response = await authAPI.register({ name, username, email });
      const user = response.data.user;

      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'LOGIN', payload: { user } });
      socketService.connect(await firebaseUser.getIdToken());

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: firebaseErrorMessage(error) };
    } finally {
      authFlowInProgress.current = false;
    }
  };

  const login = async (credentials) => {
    authFlowInProgress.current = true;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { email, password } = credentials;

      // 1. Sign in with Firebase
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);

      // 2. Fetch backend profile (token sent automatically by api.js interceptor)
      const response = await authAPI.login({});
      const user = response.data.user;

      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'LOGIN', payload: { user } });
      socketService.connect(await firebaseUser.getIdToken());

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: firebaseErrorMessage(error) };
    } finally {
      authFlowInProgress.current = false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    } finally {
      await signOut(auth);
      localStorage.removeItem('user');
      socketService.disconnect();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = { ...state, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function firebaseErrorMessage(error) {
  // Firebase SDK errors have an error.code
  if (error.code) {
    switch (error.code) {
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/invalid-email': return 'Invalid email address format.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/user-not-found': return 'No account found with that email. Please check your email or register.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again or reset your password.';
      case 'auth/invalid-credential': return 'Incorrect email or password. Please try again or reset your password.';
      case 'auth/too-many-requests': return 'Too many failed attempts. Please wait a few minutes before trying again.';
      case 'auth/network-request-failed': return 'Network error — check your internet connection and try again.';
      case 'auth/user-disabled': return 'This account has been disabled. Please contact support.';
      default: return error.message || 'Firebase authentication failed.';
    }
  }

  // Network error — backend unreachable (no response at all)
  if (!error.response) {
    return 'Cannot reach the server. Check your internet connection or try again later.';
  }

  // HTTP errors from our backend
  const status = error.response?.status;
  const backendMessage = error.response?.data?.error;

  switch (status) {
    case 401: return 'Authentication failed — your session token was rejected by the server. Try signing in again.';
    case 404: return 'No account found for this user. Please register first.';
    case 503: return 'Server is temporarily unavailable (may still be starting up). Please try again in a moment.';
    case 500: return 'A server error occurred. Please try again.';
    default:
      if (backendMessage) return backendMessage;
      return `Login failed (HTTP ${status}). Please try again.`;
  }
}
