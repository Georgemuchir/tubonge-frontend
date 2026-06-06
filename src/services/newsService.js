import { getActiveApiUrl } from './serverConfig';
import { auth } from '../firebase';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function base() {
  return getActiveApiUrl();
}

export async function getInterests() {
  const headers = await authHeaders();
  const res = await fetch(`${base()}/news/interests`, { headers });
  if (!res.ok) throw new Error('Failed to load interests');
  return res.json();
}

export async function saveInterests(categories) {
  const headers = await authHeaders();
  const res = await fetch(`${base()}/news/interests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ categories }),
  });
  if (!res.ok) throw new Error('Failed to save interests');
  return res.json();
}

export async function getFeed() {
  const headers = await authHeaders();
  const res = await fetch(`${base()}/news/feed`, { headers });
  if (!res.ok) throw new Error('Failed to load feed');
  return res.json();
}

export async function trackInteraction(articleId, action, duration = null) {
  try {
    const headers = await authHeaders();
    await fetch(`${base()}/news/interactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ articleId, action, duration }),
    });
  } catch {
    // best-effort — don't block the user
  }
}
