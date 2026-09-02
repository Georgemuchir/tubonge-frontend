import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ConfirmEmailChange from './components/auth/ConfirmEmailChange';
import TubongeMessenger from './components/TubongeMessenger';
import UpdateGate from './components/UpdateGate';
import { auth } from './firebase';
import { serverReady, hasLocalServer, isUsingFallback } from './services/serverConfig';
import './App.css';

// Captures the first uncaught error/rejection so the diagnostic loading
// screen below can show *something* even if React itself never re-renders
// past the loading state (e.g. a hung promise with no visible failure).
let _lastGlobalError = null;
window.addEventListener('error', (e) => { _lastGlobalError = e.message || String(e.error); });
window.addEventListener('unhandledrejection', (e) => { _lastGlobalError = 'unhandled rejection: ' + (e.reason?.message || String(e.reason)); });

// Loading screen that starts showing diagnostics if it's been stuck a
// while — normal loads never see this, it only kicks in past ~3s.
const LoadingScreen = () => {
  const [elapsed, setElapsed] = useState(0);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    serverReady.then(() => setServerStatus(isUsingFallback() ? 'fallback (Render)' : 'primary (home server)'))
      .catch((err) => setServerStatus('serverReady rejected: ' + err.message));
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
        {elapsed >= 3 && (
          <div className="mt-6 text-left text-xs text-gray-400 bg-gray-900/40 rounded p-3 max-w-sm mx-auto">
            <p>Stuck {elapsed}s — diagnostics:</p>
            <p>firebase auth object: {auth ? 'present' : 'MISSING'}</p>
            <p>hasLocalServer: {String(hasLocalServer)}</p>
            <p>serverReady: {serverStatus}</p>
            <p>last JS error: {_lastGlobalError || 'none'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

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

  if (loading) return <LoadingScreen />;

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

  if (loading) return <LoadingScreen />;

  return isAuthenticated ? <Navigate to="/" /> : children;
};

// Layout component that wraps all routes with AuthProvider and ThemeProvider
const AuthLayout = () => (
  <ThemeProvider>
    <AuthProvider>
      <div className="App">
        <Outlet />
      </div>
    </AuthProvider>
  </ThemeProvider>
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
          path: "/confirm-email-change",
          element: <ConfirmEmailChange />,
        },
        {
          path: "/",
          element: (
            <ProtectedRoute>
              <TubongeMessenger />
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
  return (
    <UpdateGate>
      <RouterProvider router={router} />
    </UpdateGate>
  );
}

export default App;
