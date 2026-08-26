import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app, auth;
try {
  app = initializeApp(firebaseConfig);
  // Default persistence auto-detects IndexedDB, and detection can hang
  // indefinitely (not fail — hang) in some Android WebViews, including
  // Capacitor's, leaving onAuthStateChanged never firing. Forcing
  // localStorage-based persistence skips that detection entirely.
  try {
    auth = initializeAuth(app, { persistence: browserLocalPersistence });
  } catch {
    // initializeAuth throws if already called for this app (e.g. HMR) — fall back
    auth = getAuth(app);
  }
} catch (err) {
  document.body.innerHTML =
    '<div style="font-family: sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem;">' +
    '<h1 style="font-size: 1.25rem;">Firebase is not configured</h1>' +
    '<p>Copy <code>.env.example</code> to <code>.env</code> and fill in the <code>VITE_FIREBASE_*</code> values from your Firebase project settings, then restart the dev server.</p>' +
    '</div>';
  throw err;
}

export { app, auth };
