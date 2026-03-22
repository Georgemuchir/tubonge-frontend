import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import WhatsAppMessenger from './components/WhatsAppMessenger';
import './App.css';

const PasswordResetBanner = () => {
  const { user } = useAuth();
  if (!user?.password_reset_required) return null;
  return (
    <div className="w-full bg-amber-500 text-white text-sm text-center px-4 py-2 flex items-center justify-center gap-2">
      <span>⚠️ Due to maintenance and security, please reset your password.</span>
      <a href="/forgot-password" className="underline font-semibold hover:text-amber-100">Reset now</a>
      <span className="text-amber-200">— Sorry for the inconvenience.</span>
    </div>
  );
};

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

  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <>
      <PasswordResetBanner />
      {children}
    </>
  );
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

// Layout component that wraps all routes with AuthProvider
const AuthLayout = () => (
  <AuthProvider>
    <div className="App">
      <Outlet />
    </div>
  </AuthProvider>
);

// Create router with shared AuthProvider via layout route
const router = createBrowserRouter(
  [
    {
      element: <AuthLayout />,
      children: [
        {
          path: "/login",
          element: (
            <PublicRoute>
              <Login />
            </PublicRoute>
          ),
        },
        {
          path: "/register",
          element: (
            <PublicRoute>
              <Register />
            </PublicRoute>
          ),
        },
        {
          path: "/forgot-password",
          element: <ForgotPassword />,
        },
        {
          path: "/reset-password",
          element: <ResetPassword />,
        },
        {
          path: "/",
          element: (
            <ProtectedRoute>
              <WhatsAppMessenger />
            </ProtectedRoute>
          ),
        },
        {
          path: "*",
          element: <Navigate to="/" />,
        },
      ],
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
