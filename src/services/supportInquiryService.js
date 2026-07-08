import { apiPost } from './api/client.js';
import { API_BASE } from '@/lib/config';

const url = `${(API_BASE || '').replace(/\/$/, '')}/api/public/support-inquiries`;

/**
 * Submit support or feedback from the public form.
 * @param {{
 *   submitterName: string,
 *   submitterEmail: string,
 *   inquiryType: string,
 *   category: string,
 *   message: string,
 *   subject?: string,
 * }} body
 */
export async function submitSupportInquiry(body) {
  const res = await apiPost(url, body, { showLoader: true });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to submit');
  }
  return res.json();
}
