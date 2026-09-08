import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, User, Mail, Lock, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', username: '', password: '', confirmPassword: '', phone_number: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    const result = await register({
      name: formData.name || formData.username,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      phone_number: formData.phone_number,
    });
    setSubmitting(false);
    if (result.success) { navigate('/'); } else { setError(result.error); }
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { strength: 0, label: '', color: '' };
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { strength: 1, label: 'Weak',   color: 'bg-red-500' };
    if (s <= 3) return { strength: 2, label: 'Fair',   color: 'bg-yellow-500' };
    return          { strength: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="auth-screen min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

      <div className="w-full max-w-md relative z-10">
        <div className="auth-card rounded-2xl p-8 relative overflow-hidden">

          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-sm mb-4" style={{ background: '#00a884' }}>
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="auth-title text-2xl font-bold mb-1 tracking-tight">Join Tubonge</h1>
            <p className="auth-subtitle text-sm">
              Create your account to get started
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-box mb-6 p-4 rounded-xl backdrop-blur-sm">
              <p className="auth-error-text text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="auth-icon w-5 h-5" />
              </div>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className="auth-input w-full pl-12 pr-28 py-3.5 rounded-xl transition-all"
                placeholder="Full name" />
              <span className="absolute inset-y-0 right-4 flex items-center text-xs auth-subtitle pointer-events-none">optional</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="auth-icon w-5 h-5" />
              </div>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                placeholder="Unique username" required minLength={3} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="auth-icon w-5 h-5" />
              </div>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                placeholder="Email address" required />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="auth-icon w-5 h-5" />
              </div>
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange}
                className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                placeholder="Phone number" required />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="auth-icon w-5 h-5" />
                </div>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                  placeholder="Password" autoComplete="new-password" required />
              </div>
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3].map((level) => (
                      <div key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                  <p className="auth-subtitle text-xs">
                    Password strength: <span className="font-semibold">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CheckCircle2 className="auth-icon w-5 h-5" />
              </div>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                className="auth-input w-full pl-12 pr-4 py-3.5 rounded-xl transition-all"
                placeholder="Confirm password" autoComplete="new-password" required />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full text-white py-3.5 px-6 rounded-xl font-semibold shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              style={{ background: '#00a884' }}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer text-center text-xs mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>

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
              Already have an account?{' '}
              <Link to="/login" className="auth-link font-semibold transition-colors underline underline-offset-2">
                Sign in
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

export default Register;
