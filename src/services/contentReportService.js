import { apiPost } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');
const root = `${base}/api/content-reports`;

/**
 * @param {{ contentType: 'Post' | 'Comment' | 'User', contentId: string, reason: string }} body
 */
export async function submitContentReport(body) {
  const res = await apiPost(root, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to submit report');
  }
  return res.json();
}
