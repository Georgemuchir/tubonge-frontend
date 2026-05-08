const trim = (url) => (url || '').trim().replace(/\/+$/, '');

const PRIMARY_API    = trim(import.meta.env.VITE_PRIMARY_API_URL);
const PRIMARY_SOCKET = trim(import.meta.env.VITE_PRIMARY_SOCKET_URL);
const FALLBACK_API   = trim(import.meta.env.VITE_FALLBACK_API_URL || import.meta.env.VITE_API_URL) || 'http://localhost:5000/api';
const FALLBACK_SOCKET = trim(import.meta.env.VITE_FALLBACK_SOCKET_URL || import.meta.env.VITE_SOCKET_URL) || 'http://localhost:5000';

// Ensure /api suffix
const ensureApi = (url) => (url && !url.endsWith('/api') ? `${url}/api` : url);

const PRIMARY_API_FULL   = ensureApi(PRIMARY_API)   || ensureApi(FALLBACK_API);
const FALLBACK_API_FULL  = ensureApi(FALLBACK_API);
const PRIMARY_SOCKET_URL  = PRIMARY_SOCKET  || FALLBACK_SOCKET;
const FALLBACK_SOCKET_URL = FALLBACK_SOCKET;

// No health-check needed when there is no separate local server configured
const HAS_LOCAL = !!(PRIMARY_API && PRIMARY_API !== FALLBACK_API) &&
  import.meta.env.VITE_SKIP_HEALTH_CHECK !== 'true';

let _apiUrl    = PRIMARY_API_FULL;
let _socketUrl = PRIMARY_SOCKET_URL;
let _usingFallback = false;
let _retryTimer = null;
const _listeners = new Set();

const _notify = () => _listeners.forEach((fn) => fn(_usingFallback));

const _checkHealth = async (apiUrl) => {
  const base = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
};

const _scheduleRetry = () => {
  clearTimeout(_retryTimer);
  // Retry primary every 30 s while using fallback
  _retryTimer = setTimeout(async () => {
    if (!_usingFallback) return;
    if (await _checkHealth(PRIMARY_API_FULL)) {
      console.info('[server] Local server back online — switching back');
      _apiUrl    = PRIMARY_API_FULL;
      _socketUrl = PRIMARY_SOCKET_URL;
      _usingFallback = false;
      _notify();
    } else {
      _scheduleRetry();
    }
  }, 30_000);
};

// Kick off immediately so consumers can await this promise
export const serverReady = HAS_LOCAL
  ? (async () => {
      if (!(await _checkHealth(PRIMARY_API_FULL))) {
        console.warn('[server] Local server unreachable — using Render fallback');
        _apiUrl    = FALLBACK_API_FULL;
        _socketUrl = FALLBACK_SOCKET_URL;
        _usingFallback = true;
        _scheduleRetry();
      }
    })()
  : Promise.resolve();

export const getActiveApiUrl    = () => _apiUrl;
export const getActiveSocketUrl = () => _socketUrl;
export const isUsingFallback    = () => _usingFallback;

// Subscribe to server switches; returns an unsubscribe fn
export const onServerSwitch = (fn) => {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
};

// True only when a separate local server is configured — used by socket to decide reconnection strategy
export const hasLocalServer = HAS_LOCAL;
