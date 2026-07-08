import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');
const cache = new Map();

/**
 * Fetches the post attachment upload policy (allowed MIME/extension lists for the composer). Cached in-memory for the session.
 * Only `postAttachment` is supported by the API.
 * @param {string} [policyName]
 * @returns {Promise<{ policyName: string, allowedMimes: string[], allowedExtensions: string[], accept: string }>}
 */
export async function getUploadPolicy(policyName) {
  const name = String(policyName || '').trim() || 'postAttachment';
  if (cache.has(name)) {
    return cache.get(name);
  }
  const p = (async () => {
    const res = await apiGet(`${base}/api/Media/upload-policies/${encodeURIComponent(name)}`, {
      showLoader: false,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || err?.title || res.statusText || 'Failed to load upload policy');
    }
    const dto = await res.json();
    return {
      policyName: String(dto?.policyName ?? dto?.PolicyName ?? name),
      allowedMimes: Array.isArray(dto?.allowedMimes ?? dto?.AllowedMimes) ? (dto.allowedMimes ?? dto.AllowedMimes) : [],
      allowedExtensions: Array.isArray(dto?.allowedExtensions ?? dto?.AllowedExtensions)
        ? (dto.allowedExtensions ?? dto.AllowedExtensions)
        : [],
      accept: String(dto?.accept ?? dto?.Accept ?? ''),
    };
  })();
  // Cache in-flight promise, but evict it on failure so future calls can retry.
  const cached = p.catch((e) => {
    cache.delete(name);
    throw e;
  });
  cache.set(name, cached);
  return cached;
}

