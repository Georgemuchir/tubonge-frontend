import { useState, useEffect } from 'react';
import { X, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth } from '../../firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';

const EditProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = name.trim();

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    const payload = {};
    if (trimmedUsername !== user?.username) payload.username = trimmedUsername;
    if (trimmedName !== user?.name) payload.name = trimmedName;

    if (Object.keys(payload).length === 0) {
      setError('No changes to save.');
      return;
    }

    setLoading(true);
    try {
      const response = await usersAPI.updateProfile(payload);
      updateUser(response.data.user);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailMsg('');

    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (trimmedEmail === (user?.email || '').toLowerCase()) {
      setEmailError('That is already your current email.');
      return;
    }
    if (!currentPassword) {
      setEmailError('Enter your current password to confirm this change.');
      return;
    }

    setEmailSaving(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setEmailError('Session expired. Please log out and back in, then try again.');
        return;
      }

      // Step 1: verify current password
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Step 2: ask Firebase to send a verification email to the NEW address.
      // Use auth.currentUser (not the stale firebaseUser ref) so Firebase
      // sees the freshly re-authenticated session and doesn't throw
      // auth/requires-recent-login.
      const actionCodeSettings = {
        url: `${window.location.origin}/confirm-email-change`,
        handleCodeInApp: true,
      };
      await verifyBeforeUpdateEmail(auth.currentUser, trimmedEmail, actionCodeSettings);

      setEmailMsg(
        `Verification email sent to ${trimmedEmail} by Firebase. ` +
        `Click the link in that email to confirm the change.`
      );
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setEmailError('Incorrect password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setEmailError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'auth/email-already-in-use') {
        setEmailError('That email is already in use by another account.');
      } else if (code === 'auth/invalid-email') {
        setEmailError('Enter a valid email address.');
      } else {
        setEmailError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-5">Edit Profile</h2>

        {/* Name + Username */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <span className="text-gray-400 text-sm mr-1">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="flex-1 text-sm focus:outline-none"
                placeholder="username"
                autoComplete="off"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> {success}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>

        {/* Email change */}
        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Change Email</p>
          <p className="text-xs text-gray-400 mb-3">
            Current: <span className="text-gray-600">{user?.email}</span>
          </p>

          <form onSubmit={handleEmailChange} className="space-y-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); setEmailMsg(''); }}
              placeholder="New email address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setEmailError(''); }}
                placeholder="Current password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {emailError && <p className="text-xs text-red-600">{emailError}</p>}
            {emailMsg && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> {emailMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={emailSaving || !newEmail.trim() || !currentPassword}
              className="w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {emailSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {emailSaving ? 'Sending…' : 'Send Verification Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
