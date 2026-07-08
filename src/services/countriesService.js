import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * @typedef {{ code: string, name: string, clusterCode: string }} SupportedCountry
 */

/**
 * @returns {Promise<SupportedCountry[]>}
 */
export async function getSupportedCountries() {
  const res = await apiGet(`${base}/api/countries/supported`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || '');
  }
  const data = await res.json();
  return normalizeCountryList(data);
}

/**
 * @returns {Promise<SupportedCountry[]>}
 */
export async function getAvailableCountries() {
  const res = await apiGet(`${base}/api/countries/available`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || '');
  }
  const data = await res.json();
  return normalizeCountryList(data);
}

/** @param {unknown} data */
function normalizeCountryList(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((row) => {
      const code = String(row?.code ?? row?.Code ?? '').trim().toUpperCase();
      const name = String(row?.name ?? row?.Name ?? '').trim();
      const clusterCode = String(row?.clusterCode ?? row?.ClusterCode ?? '').trim().toUpperCase();
      if (code.length !== 2) {
        return null;
      }
      return { code, name: name || code, clusterCode };
    })
    .filter(Boolean);
}
