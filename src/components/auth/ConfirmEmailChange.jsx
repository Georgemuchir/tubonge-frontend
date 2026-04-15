import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  const token = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          <p className="text-gray-400 mb-6">No confirmation token found. Please request a new email change from your profile settings.</p>
          <Link to="/" className="inline-block px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">
            Back to Pinglo
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Email Updated</h1>
          <p className="text-gray-400 mb-6">{success}</p>
          <Link to="/" className="inline-block px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors">
            Go to Pinglo
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your current password.');
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError('You must be logged in to confirm the email change. Please log in first.');
        setLoading(false);
        return;
      }

      // Re-authenticate with current (old) password
      const credential = EmailAuthProvider.credential(firebaseUser.email, password);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Confirm the email change via backend token
      const res = await usersAPI.confirmEmailChange(token);
      const newEmail = res.data.email;
      updateUser({ email: newEmail });
      setSuccess(`Your email has been updated to ${newEmail}.`);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Something went wrong. Please try again or request a new verification link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-white mb-1">Confirm Email Change</h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter your new email address and current password to complete the change.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="new@example.com"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Current password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Your current password"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Confirming…' : 'Confirm Email Change'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Link expired?{' '}
          <Link to="/" className="text-teal-400 hover:underline">
            Go to settings to request a new one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ConfirmEmailChange;
