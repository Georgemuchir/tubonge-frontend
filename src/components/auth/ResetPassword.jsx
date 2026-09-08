import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../firebase';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Verify oobCode on mount
  useEffect(() => {
    if (!oobCode) {
      setError('Invalid reset link');
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setTokenValid(true))
      .catch((err) => {
        console.error('verifyPasswordResetCode error:', err.code, err.message);
        setError(`This password reset link is invalid or has expired. (${err.code})`);
      })
      .finally(() => setVerifying(false));
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      try { await authAPI.acknowledgeReset(); } catch { /* best effort */ }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.code === 'auth/expired-action-code'
        ? 'This reset link has expired. Please request a new one.'
        : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-screen min-h-screen flex items-center justify-center p-4">
        <div className="auth-card rounded-2xl p-8 w-full max-w-md text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mb-4" style={{ borderColor: '#00a884', borderTopColor: 'transparent' }}></div>
          <p className="auth-title">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-screen min-h-screen flex items-center justify-center p-4">
        <div className="auth-card rounded-2xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 mb-6">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="auth-title text-2xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="auth-subtitle mb-6">{error || 'This password reset link is invalid or has expired.'}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-3 rounded-xl text-white font-semibold hover:brightness-110 transition-all"
            style={{ background: '#00a884' }}
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-screen min-h-screen flex items-center justify-center p-4">
        <div className="auth-card rounded-2xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: '#00a884' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="auth-title text-2xl font-bold mb-4">Password Reset Successful!</h2>
          <p className="auth-subtitle mb-6">Your password has been updated. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="auth-card rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#00a884' }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="auth-title text-2xl font-bold mb-2">Reset Password</h2>
          <p className="auth-subtitle">Choose a new secure password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="auth-error-box p-3 rounded-lg">
              <p className="auth-error-text text-sm">{error}</p>
            </div>
          )}

          <div className="relative">
            <Lock className="auth-icon absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              required
              className="auth-input w-full pl-12 pr-12 py-3 rounded-xl transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-icon absolute right-4 top-1/2 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="auth-icon absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              className="auth-input w-full pl-12 pr-12 py-3 rounded-xl transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="auth-icon absolute right-4 top-1/2 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="auth-subtitle text-xs">
            <p className={password.length >= 6 ? 'text-emerald-500' : ''}>
              Password must be at least 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-3 rounded-xl text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            style={{ background: '#00a884' }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
