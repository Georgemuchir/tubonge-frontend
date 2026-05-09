import { describe, it, expect } from 'vitest';

const normalizeApiBaseUrl = (url) => {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5000/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

describe('normalizeApiBaseUrl', () => {
  it('appends /api when missing', () => {
    expect(normalizeApiBaseUrl('https://example.com')).toBe('https://example.com/api');
  });

  it('does not double-append /api', () => {
    expect(normalizeApiBaseUrl('https://example.com/api')).toBe('https://example.com/api');
  });

  it('strips trailing slash before checking', () => {
    expect(normalizeApiBaseUrl('https://example.com/')).toBe('https://example.com/api');
  });

  it('returns localhost default for empty input', () => {
    expect(normalizeApiBaseUrl('')).toBe('http://localhost:5000/api');
    expect(normalizeApiBaseUrl(null)).toBe('http://localhost:5000/api');
  });
});
