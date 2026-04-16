import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const { updateUser, isAuthenticated, loading: authLoading } = useAuth();

  const token = searchParams.get('token') || '';
  const newEmail = searchParams.get('email') || '';

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  // Auto-confirm as soon as the user is authenticated and token is present
  useEffect(() => {
    if (authLoading || !token || status !== 'idle') return;
    if (!isAuthenticated) return; // wait for auth state; handled in render below
    confirm();
  }, [authLoading, isAuthenticated, token, status]);

  const confirm = async () => {
    setStatus('loading');
    try {
      const res = await usersAPI.confirmEmailChange(token);
      updateUser({ email: res.data.email });
      setStatus('success');
      setMessage(`Your email has been updated to ${res.data.email}.`);
    } catch (err) {
      setStatus('error');
      setMessage(
        err.response?.data?.error ||
        'Something went wrong. Please request a new confirmation link.'
      );
    }
  };

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Sign in first</h1>
          <p className="text-gray-400 mb-6">
            You need to be signed in to confirm your email change.
            Please log in, then click the link in your email again.
          </p>
          <Link to="/login" className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── No token in URL ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400 mb-6">
            No confirmation token found. Please request a new email change from your profile settings.
          </p>
          <Link to="/" className="inline-block px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">
            Back to Pinglo
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading / confirming ─────────────────────────────────────────────────
  if (authLoading || status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">
            {newEmail ? `Confirming email change to ${newEmail}…` : 'Confirming email change…'}
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Email Updated</h1>
          <p className="text-gray-400 mb-6">{message}</p>
          <Link to="/" className="inline-block px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors">
            Go to Pinglo
          </Link>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Confirmation Failed</h1>
        <p className="text-gray-400 mb-6">{message}</p>
        <Link to="/" className="inline-block px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">
          Back to Settings
        </Link>
      </div>
    </div>
  );
};

export default ConfirmEmailChange;
