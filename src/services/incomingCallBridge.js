// JS-side interface for the custom native IncomingCallPlugin (Android only —
// see android/app/.../IncomingCallPlugin.java). There's no separate npm
// package for this, it's app-specific, so it's registered directly via
// Capacitor's registerPlugin() the same way an installed plugin would be
// under the hood.
import { registerPlugin } from '@capacitor/core';

const IncomingCall = registerPlugin('IncomingCall');

// Cold start: app was fully closed, launched by tapping a call
// notification. Call once after the authenticated UI has mounted.
export const getPendingCall = async () => {
  try {
    const result = await IncomingCall.getPendingCall();
    return result?.callerId ? result : null;
  } catch {
    // Plugin doesn't exist on this platform (web) or isn't ready yet.
    return null;
  }
};

// Already running (backgrounded, not killed): MainActivity.onNewIntent()
// fires instead of a fresh launch, so this is how the notification tap
// reaches JS in that case. Returns an unsubscribe function.
export const onIncomingCall = (callback) => {
  const handle = IncomingCall.addListener('incomingCall', callback);
  return () => handle.remove();
};
