import { useState } from 'react';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
      setSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setSent(true);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-screen min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="auth-card rounded-2xl p-8 w-full max-w-md relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: '#00a884' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="auth-title text-2xl font-bold mb-4">Check Your Email</h2>
          <p className="auth-subtitle mb-6">
            If an account exists with <strong>{email}</strong>, you will receive password reset instructions shortly.
          </p>
          <p className="auth-footer text-sm mb-8">
            Please check your spam folder if you don't see the email within a few minutes.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl text-white font-semibold hover:brightness-110 transition-all"
            style={{ background: '#00a884' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="auth-card rounded-2xl p-8 w-full max-w-md relative z-10">
        <button
          onClick={() => navigate('/login')}
          className="auth-subtitle flex items-center gap-2 hover:opacity-80 transition-opacity mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#00a884' }}>
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="auth-title text-2xl font-bold mb-2">Forgot Password?</h2>
          <p className="auth-subtitle">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="auth-error-box p-3 rounded-lg">
              <p className="auth-error-text text-sm">{error}</p>
            </div>
          )}

          <div className="relative">
            <Mail className="auth-icon absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="auth-input w-full pl-12 pr-4 py-3 rounded-xl transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-xl text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            style={{ background: '#00a884' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
