import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { verifyBeforeUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
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
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [emailError, setEmailError] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

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
      const msg = err.response?.data?.error || 'Failed to update profile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailLink = async (password = null) => {
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (trimmedEmail === (user?.email || '').toLowerCase()) {
      setEmailError('That is already your current email.');
      return;
    }
    setEmailSending(true);
    setEmailError('');
    setEmailMsg('');
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Not signed in');

      if (password) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
        setNeedsReauth(false);
        setReauthPassword('');
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/confirm-email-change`,
        handleCodeInApp: false,
      };
      await verifyBeforeUpdateEmail(firebaseUser, trimmedEmail, actionCodeSettings);
      setEmailMsg(`Verification link sent to ${trimmedEmail}. Click it to confirm the change.`);
      setNewEmail('');
    } catch (err) {
      const code = err?.code || '';
      console.error('[EmailChange] Firebase error:', code, err?.message);
      if (code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
        setEmailError('For security, please enter your password to continue.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setEmailError('Incorrect password. Please try again.');
      } else if (code === 'auth/email-already-in-use') {
        setEmailError('That email is already used by another account.');
      } else if (code === 'auth/invalid-email') {
        setEmailError('Invalid email address.');
      } else {
        setEmailError(`Error (${code || 'unknown'}): ${err?.message || 'Failed to send link.'}`);
      }
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-5">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
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
            <p className="text-xs text-gray-400 mt-1">
              Others can find you by your username.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> {success}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
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

        {/* Email change section */}
        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Change Email</p>
          <p className="text-xs text-gray-400 mb-3">
            Current: <span className="text-gray-600">{user?.email}</span>
          </p>

          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); setEmailMsg(''); setNeedsReauth(false); }}
              placeholder="new@email.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!needsReauth && (
              <button
                type="button"
                onClick={() => handleSendEmailLink()}
                disabled={emailSending || !newEmail.trim()}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {emailSending ? 'Sending…' : 'Send link'}
              </button>
            )}
          </div>

          {needsReauth && (
            <div className="flex gap-2 mt-2">
              <input
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && reauthPassword && handleSendEmailLink(reauthPassword)}
              />
              <button
                type="button"
                onClick={() => handleSendEmailLink(reauthPassword)}
                disabled={emailSending || !reauthPassword}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {emailSending ? 'Sending…' : 'Confirm'}
              </button>
            </div>
          )}

          {emailError && <p className="text-xs text-red-600 mt-2">{emailError}</p>}
          {emailMsg && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" />{emailMsg}</p>}
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
