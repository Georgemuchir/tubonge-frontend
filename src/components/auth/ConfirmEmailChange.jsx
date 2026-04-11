import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No confirmation token found in the link. Please request a new email change.');
      return;
    }

    usersAPI.confirmEmailChange(token)
      .then((res) => {
        const newEmail = res.data.email;
        updateUser({ email: newEmail });
        setStatus('success');
        setMessage(`Your email has been updated to ${newEmail}.`);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Invalid or expired link. Please request a new email change.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
            <p className="text-gray-300">Confirming your email change…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Email Updated</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
            >
              Go to Pinglo
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Confirmation Failed</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              Back to Pinglo
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailChange;
