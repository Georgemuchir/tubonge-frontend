/**
 * ConfirmEmailChange
 *
 * Handles the Firebase email-change verification link:
 *   /confirm-email-change?mode=verifyAndChangeEmail&oobCode=...&continueUrl=...
 *
 * Firebase sends this link to the new email address after the user calls
 * verifyBeforeUpdateEmail(). We call applyActionCode() to let Firebase apply
 * the change, then the backend auto-syncs the new email on the next request
 * (auth middleware compares Firebase token email with DB email).
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { applyActionCode, reload } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') || '';

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (!oobCode || calledRef.current) return;
    calledRef.current = true;
    confirm();
  }, [oobCode]);

  const confirm = async () => {
    setStatus('loading');
    try {
      // Apply the Firebase action code — this changes the email in Firebase Auth
      await applyActionCode(auth, oobCode);

      // If the user is logged in on this device, refresh their token so the
      // app immediately reflects the new email. The backend auth middleware
      // will auto-sync the new email to MongoDB on the next request.
      if (auth.currentUser) {
        await reload(auth.currentUser);
        await auth.currentUser.getIdToken(true);
      }

      setStatus('success');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
        setMessage('This link has expired or already been used. Please request a new email change.');
      } else if (code === 'auth/email-already-in-use') {
        setMessage('That email address is already in use by another account.');
      } else {
        setMessage(err.message || 'Something went wrong. Please request a new verification link.');
      }
      setStatus('error');
    }
  };

  // ── No oobCode ───────────────────────────────────────────────────────────
  if (!oobCode) {
    return (
      <Screen icon="x" iconColor="red">
        <h1 className="text-xl font-semibold text-white mb-2">Invalid Link</h1>
        <p className="text-gray-400 mb-6">
          This link is missing required parameters. Please request a new email change from your profile settings.
        </p>
        <Link to="/" className="btn-secondary">Back to Tubonge</Link>
      </Screen>
    );
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen>
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Confirming your email change…</p>
      </Screen>
    );
  }

  if (status === 'success') {
    const isLoggedIn = !!auth.currentUser;
    return (
      <Screen icon="check" iconColor="teal">
        <h1 className="text-xl font-semibold text-white mb-2">Email Updated</h1>
        <p className="text-gray-400 mb-6">
          {isLoggedIn
            ? 'Your email has been updated. You may need to log out and back in for all changes to take effect.'
            : 'Your email has been updated. Please log in with your new email address.'}
        </p>
        <Link to={isLoggedIn ? '/' : '/login'} className="btn-teal">
          {isLoggedIn ? 'Go to Tubonge' : 'Go to Login'}
        </Link>
      </Screen>
    );
  }

  return (
    <Screen icon="x" iconColor="red">
      <h1 className="text-xl font-semibold text-white mb-2">Confirmation Failed</h1>
      <p className="text-gray-400 mb-6">{message}</p>
      <Link to="/" className="btn-secondary">Back to Settings</Link>
    </Screen>
  );
};

// ── Layout helper ────────────────────────────────────────────────────────────
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
      <style>{`
        .btn-teal     { display:inline-block;padding:.6rem 1.5rem;border-radius:.75rem;background:#0d9488;color:#fff;font-weight:500;transition:background .15s; }
        .btn-teal:hover { background:#0f766e; }
        .btn-secondary{ display:inline-block;padding:.6rem 1.5rem;border-radius:.75rem;background:#374151;color:#fff;font-weight:500;transition:background .15s; }
        .btn-secondary:hover { background:#4b5563; }
      `}</style>
    </div>
  );
};

export default ConfirmEmailChange;
