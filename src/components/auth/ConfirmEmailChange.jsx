/**
 * ConfirmEmailChange
 *
 * Landed on via the link in the confirmation email:
 *   /confirm-email-change?token=<raw_token>
 *
 * No login required — the one-time token is the proof.
 * We send the token to the backend, which verifies it, updates the email,
 * and returns the new address.
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('idle');   // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const calledRef = useRef(false);                 // prevent double-fire in StrictMode

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    const confirm = async () => {
      setStatus('loading');
      try {
        const res = await usersAPI.confirmEmailChange(token);
        setNewEmail(res.data.email);
        setStatus('success');
      } catch (err) {
        setMessage(
          err.response?.data?.error ||
          'Something went wrong. Please request a new confirmation link from your profile settings.'
        );
        setStatus('error');
      }
    };

    confirm();
  }, [token]);

  // ── No token in URL ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <Screen icon="x" iconColor="red">
        <h1 className="text-xl font-semibold text-white mb-2">Invalid Link</h1>
        <p className="text-gray-400 mb-6">
          No confirmation token found. Please request a new email change from your profile settings.
        </p>
        <Link to="/" className="btn-secondary">Back to Pinglo</Link>
      </Screen>
    );
  }

  // ── Confirming ───────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'loading') {
    return (
      <Screen>
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Confirming your email change…</p>
      </Screen>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <Screen icon="check" iconColor="teal">
        <h1 className="text-xl font-semibold text-white mb-2">Email Updated</h1>
        <p className="text-gray-400 mb-6">
          Your email has been changed to <strong className="text-white">{newEmail}</strong>.
          Please log in again with your new address.
        </p>
        <Link to="/login" className="btn-teal">Go to Login</Link>
      </Screen>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  return (
    <Screen icon="x" iconColor="red">
      <h1 className="text-xl font-semibold text-white mb-2">Confirmation Failed</h1>
      <p className="text-gray-400 mb-6">{message}</p>
      <Link to="/" className="btn-secondary">Back to Settings</Link>
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Small layout helper — avoids duplicating the outer card
// ---------------------------------------------------------------------------
const iconMap = {
  check: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const colorMap = {
  teal: { ring: 'bg-teal-500/20', icon: 'text-teal-400' },
  red:  { ring: 'bg-red-500/20',  icon: 'text-red-400'  },
};

const Screen = ({ icon, iconColor, children }) => {
  const colors = colorMap[iconColor] || {};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {icon && (
          <div className={`w-14 h-14 rounded-full ${colors.ring} flex items-center justify-center mx-auto mb-4`}>
            <span className={colors.icon}>{iconMap[icon]}</span>
          </div>
        )}
        {children}
      </div>

      {/* Inline button styles to avoid Tailwind config dependency */}
      <style>{`
        .btn-teal    { display:inline-block; padding:.6rem 1.5rem; border-radius:.75rem; background:#0d9488; color:#fff; font-weight:500; transition:background .15s; }
        .btn-teal:hover { background:#0f766e; }
        .btn-secondary { display:inline-block; padding:.6rem 1.5rem; border-radius:.75rem; background:#374151; color:#fff; font-weight:500; transition:background .15s; }
        .btn-secondary:hover { background:#4b5563; }
      `}</style>
    </div>
  );
};

export default ConfirmEmailChange;
