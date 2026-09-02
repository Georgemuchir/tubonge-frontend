import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getActiveApiUrl, serverReady } from '../services/serverConfig';

// Native app only — the website always serves whatever's currently deployed,
// there's nothing to "update" there.
const IS_NATIVE = Capacitor.isNativePlatform();

// Grace period before a soft nudge escalates to a full-screen block. Chosen
// to give a couple of days of normal dismissible reminders before it
// actually gets in the way of using the app.
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

const CURRENT_BUILD = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : 0;

export default function UpdateGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | current | soft | blocked
  const [downloadUrl, setDownloadUrl] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!IS_NATIVE) {
      setStatus('current');
      return;
    }

    const check = async () => {
      try {
        await serverReady;
        const res = await fetch(`${getActiveApiUrl()}/app/version`, {
          signal: AbortSignal.timeout(8000),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const latestBuild = Number(data.latest_build) || 0;
        setDownloadUrl(data.download_url || '');

        if (!latestBuild || CURRENT_BUILD >= latestBuild) {
          setStatus('current');
          return;
        }

        const key = `update_first_seen_${latestBuild}`;
        let firstSeen = Number(localStorage.getItem(key));
        if (!firstSeen) {
          firstSeen = Date.now();
          try { localStorage.setItem(key, String(firstSeen)); } catch {}
        }

        setStatus(Date.now() - firstSeen > GRACE_PERIOD_MS ? 'blocked' : 'soft');
      } catch {
        // Can't reach the version check — never block the app over a
        // network hiccup, just skip the nudge for this session.
        setStatus('current');
      }
    };

    check();
    // Re-check occasionally in case the app stays open a while — cheap,
    // and lets the escalation-to-blocked transition happen without a
    // full app relaunch.
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0d0b1a' }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">⬆️</div>
          <h1 className="text-xl font-bold text-white mb-2">Update required</h1>
          <p className="text-sm text-gray-400 mb-6">
            This version of Tubonge is too old to keep using. Download the latest build to continue.
          </p>
          <a
            href={downloadUrl}
            className="inline-block w-full py-3 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
          >
            Download update
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {status === 'soft' && !dismissed && (
        <div className="w-full bg-purple-600 text-white text-sm text-center px-4 py-2 flex items-center justify-center gap-3">
          <span>A newer version of Tubonge is available.</span>
          <a href={downloadUrl} className="underline font-semibold">Update now</a>
          <button onClick={() => setDismissed(true)} className="text-purple-200 hover:text-white ml-2" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
      {children}
    </>
  );
}
