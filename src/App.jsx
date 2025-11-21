import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import Login from './components/Login';
import Register from './components/Register';
import WhatsAppMessenger from './components/WhatsAppMessenger';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to chat if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" /> : children;
};

// Create router with v7 future flags enabled
const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: (
        <AuthProvider>
          <div className="App">
            <PublicRoute>
              <Login />
            </PublicRoute>
          </div>
        </AuthProvider>
      ),
    },
    {
      path: "/register", 
      element: (
        <AuthProvider>
          <div className="App">
            <PublicRoute>
              <Register />
            </PublicRoute>
          </div>
        </AuthProvider>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <AuthProvider>
          <div className="App">
            <ForgotPassword />
          </div>
        </AuthProvider>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <AuthProvider>
          <div className="App">
            <ResetPassword />
          </div>
        </AuthProvider>
      ),
    },
    {
      path: "/",
      element: (
        <AuthProvider>
          <div className="App">
            <ProtectedRoute>
              <WhatsAppMessenger />
            </ProtectedRoute>
          </div>
        </AuthProvider>
      ),
    },
    {
      path: "*",
      element: (
        <AuthProvider>
          <div className="App">
            <Navigate to="/" />
          </div>
        </AuthProvider>
      ),
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
