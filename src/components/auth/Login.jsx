import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
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

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="auth-blob absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="auth-blob absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="auth-blob absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="auth-card backdrop-blur-xl rounded-3xl p-8 relative overflow-hidden">

          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-4 transform transition-transform hover:scale-110 hover:rotate-3">
              <MessageCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="auth-title text-4xl font-bold mb-2 tracking-tight">Welcome back</h1>
            <p className="auth-subtitle text-sm flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" />
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
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
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

      <style>{`
        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1); }
          25%      { transform: translate(20px,-50px) scale(1.1); }
          50%      { transform: translate(-20px,20px) scale(0.9); }
          75%      { transform: translate(50px,50px) scale(1.05); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Login;
