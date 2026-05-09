import { describe, it, expect } from 'vitest';

const trim = (url) => (url || '').trim().replace(/\/+$/, '');
const ensureApi = (url) => (url && !url.endsWith('/api') ? `${url}/api` : url);

const buildHasLocal = (primary, fallback, skipHealthCheck) => {
  return !!(primary && primary !== fallback) && skipHealthCheck !== 'true';
};

describe('server config logic', () => {
  const FALLBACK = 'https://pinglo-backend-staging.onrender.com/api';

  it('HAS_LOCAL is true when primary differs from fallback', () => {
    expect(buildHasLocal('http://localhost:5000/api', FALLBACK, 'false')).toBe(true);
  });

  it('HAS_LOCAL is false when primary equals fallback', () => {
    expect(buildHasLocal(FALLBACK, FALLBACK, 'false')).toBe(false);
  });

  it('HAS_LOCAL is false when primary is empty', () => {
    expect(buildHasLocal('', FALLBACK, 'false')).toBe(false);
  });

  it('HAS_LOCAL is false when VITE_SKIP_HEALTH_CHECK=true', () => {
    expect(buildHasLocal('http://localhost:5000/api', FALLBACK, 'true')).toBe(false);
  });

  it('ensureApi appends /api suffix', () => {
    expect(ensureApi('https://example.com')).toBe('https://example.com/api');
  });

  it('ensureApi does not double-append', () => {
    expect(ensureApi('https://example.com/api')).toBe('https://example.com/api');
  });

  it('trim removes trailing slashes', () => {
    expect(trim('https://example.com/')).toBe('https://example.com');
    expect(trim('  https://example.com  ')).toBe('https://example.com');
  });
});
