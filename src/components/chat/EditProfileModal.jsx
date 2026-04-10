import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';

const EditProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
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
      </div>
    </div>
  );
};

export default EditProfileModal;
