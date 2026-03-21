import { createContext, useContext, useReducer, useEffect } from 'react';
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

  // Listen to Firebase auth state — source of truth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch profile from our backend using the Firebase ID token
          const response = await authAPI.getProfile();
          const user = response.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          dispatch({ type: 'LOGIN', payload: { user } });
          socketService.connect(await firebaseUser.getIdToken());
        } catch {
          // Firebase session exists but no backend profile — sign out
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
    }
  };

  const login = async (credentials) => {
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
  switch (error.code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password. Please try again or reset your password.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    default: return error.message || 'Authentication failed.';
  }
}
