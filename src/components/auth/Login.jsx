import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showUsername, setShowUsername] = useState(false);
  const [error, setError] = useState('');
  const [showResetHint, setShowResetHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setShowResetHint(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(formData);
    setSubmitting(false);
    if (result.success) {
      navigate('/');
    } else {
      const message = result.error || 'Login failed. Please try again.';
      const hint = message.toLowerCase().includes('incorrect') || message.toLowerCase().includes('password');
      setError(message);
      setShowResetHint(hint);
      if (result.error && result.error.toLowerCase().includes('username')) {
        setShowUsername(true);
        setFormData({ ...formData, username: '' });
      }
    }
  };

  return (
    <div className="auth-screen min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

      <div className="w-full max-w-md relative z-10">
        <div className="auth-card rounded-2xl p-8 relative overflow-hidden">

          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-sm mb-4" style={{ background: '#00a884' }}>
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="auth-title text-2xl font-bold mb-1 tracking-tight">Welcome back</h1>
            <p className="auth-subtitle text-sm">
              Sign in to continue to Tubonge
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-box mb-6 p-4 rounded-xl backdrop-blur-sm">
              <p className="auth-error-text text-sm text-center font-medium">{error}</p>
              {showResetHint && (
                <p className="auth-error-text text-sm text-center mt-1">
                  If you had an account before, please{' '}
                  <Link to="/forgot-password" className="auth-error-link underline font-semibold transition-colors">
                    reset your password
                  </Link>
                  {' '}to log in.
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {showUsername && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="auth-icon w-5 h-5" />
                </div>
                <input
                  type="text" name="username" value={formData.username || ''}
                  onChange={handleChange}
                  className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                  placeholder="Set your username" required minLength={3}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="auth-icon w-5 h-5" />
              </div>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange}
                className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                placeholder="Email address" required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="auth-icon w-5 h-5" />
              </div>
              <input
                type="password" name="password" value={formData.password}
                onChange={handleChange}
                className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                placeholder="Password" autoComplete="current-password" required
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="auth-forgot text-sm transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full text-white py-3.5 px-6 rounded-xl font-semibold shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              style={{ background: '#00a884' }}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="auth-divider w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="auth-divider-text px-4 bg-transparent font-medium">OR</span>
            </div>
          </div>

          <div className="text-center">
            <p className="auth-subtitle text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link font-semibold transition-colors underline underline-offset-2">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="auth-footer text-center text-xs mt-6">
          © 2026 Tubonge. Secure messaging made simple.
        </p>
      </div>
    </div>
  );
};

export default Login;
