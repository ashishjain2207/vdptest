import { apiGet, apiPost, apiPut } from './api/client.js';
import { API_BASE } from '@/lib/config';
import { normalizeCountryCode } from '@/lib/activeCountry.js';

const base = (API_BASE || '').replace(/\/$/, '');

const PENDING_HOME_KEY = 'pendingHomeCountry';
const PENDING_HOME_EMAIL_KEY = 'pendingHomeCountryEmail';
const PENDING_HOME_SOCIAL_SIGNUP_KEY = 'pendingHomeCountrySocialSignup';
const PENDING_HOME_SOCIAL_SIGNUP_STATE_KEY = 'pendingHomeCountrySocialSignupState';

function getStorage(name) {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null;
  }
}

function eachStorage(callback) {
  for (const name of ['sessionStorage', 'localStorage']) {
    const store = getStorage(name);
    if (store) {
      callback(store);
    }
  }
}

function getStoredValue(key) {
  let found = null;
  eachStorage((store) => {
    if (found !== null) {
      return;
    }
    try {
      const value = store.getItem(key);
      if (value !== null && value !== undefined) {
        found = value;
      }
    } catch {
      /* ignore */
    }
  });
  return found;
}

function getPendingHomeCountryFromMatchingEmail(email) {
  if (!email) {
    return null;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  let found = null;
  eachStorage((store) => {
    if (found !== null) {
      return;
    }
    try {
      const rawEmail = store.getItem(PENDING_HOME_EMAIL_KEY);
      const pendingEmail = typeof rawEmail === 'string' && rawEmail.trim()
        ? rawEmail.trim().toLowerCase()
        : null;
      if (pendingEmail !== normalizedEmail) {
        return;
      }

      found = normalizeCountryCode(store.getItem(PENDING_HOME_KEY));
    } catch {
      /* ignore */
    }
  });
  return found;
}

function getPendingHomeCountryFromMatchingSocialState(oauthState) {
  if (!oauthState) {
    return null;
  }

  let found = null;
  eachStorage((store) => {
    if (found !== null) {
      return;
    }
    try {
      const country = normalizeCountryCode(store.getItem(PENDING_HOME_KEY));
      if (
        store.getItem(PENDING_HOME_SOCIAL_SIGNUP_KEY) === '1' &&
        country &&
        store.getItem(PENDING_HOME_SOCIAL_SIGNUP_STATE_KEY) === oauthState
      ) {
        found = country;
      }
    } catch {
      /* ignore */
    }
  });
  return found;
}

function removeStoredValue(key) {
  eachStorage((store) => {
    try {
      store.removeItem(key);
    } catch {
      /* ignore */
    }
  });
}

/** @returns {string | null} */
export function peekPendingHomeCountry() {
  return normalizeCountryCode(getStoredValue(PENDING_HOME_KEY));
}

export function clearPendingHomeCountry() {
  removeStoredValue(PENDING_HOME_KEY);
  removeStoredValue(PENDING_HOME_EMAIL_KEY);
  removeStoredValue(PENDING_HOME_SOCIAL_SIGNUP_KEY);
  removeStoredValue(PENDING_HOME_SOCIAL_SIGNUP_STATE_KEY);
}

/**
 * @param {string | null | undefined} oauthState
 * @returns {string | null}
 */
export function getPendingSocialSignupHomeCountry(oauthState) {
  return getPendingHomeCountryFromMatchingSocialState(oauthState);
}

/**
 * @param {string | null | undefined} oauthState
 * @returns {boolean}
 */
export function hasPendingSocialSignupHomeCountry(oauthState) {
  return Boolean(getPendingSocialSignupHomeCountry(oauthState));
}

/**
 * Ensures the current user has a profile in VdpConnect. If not, creates a minimal one.
 * Call after login when profile fetch returns 404 so follow/connect/notifications work.
 * @param {object} [opts]
 * @param {string} [opts.displayName] - Display name from Identity (e.g. from userinfo)
 * @param {string} [opts.handle] - Preferred handle (username) from Identity
 * @param {string} [opts.email] - Email from Identity (userinfo or token) for profile linking / contactEmail
 * @param {number} [opts.reason] - Provisioning reason for API logs: 0 = login (default), 1 = password reset, 2 = identity/OAuth sync
 * @param {string} [opts.homeCountryCode] - ISO alpha-2
 * @param {boolean} [opts.usePendingHomeCountry] - Explicit onboarding-only opt-in to consume pending signup/social country
 * @returns {Promise<object|null>} The profile DTO or null on failure
 */
export async function ensureProfile(opts = {}) {
  const {
    displayName,
    handle,
    email,
    reason,
    homeCountryCode,
    usePendingHomeCountry,
  } = opts;

  const body = {};
  if (displayName) {
    body.displayName = displayName;
  }
  if (handle) {
    body.handle = handle;
  }
  if (email) {
    body.email = email;
  }
  if (reason !== undefined && reason !== null && reason !== '') {
    body.reason = reason;
  }

  const explicitHc = normalizeCountryCode(homeCountryCode ?? '');
  // Prefer email-matched pending storage (signup verify → login), then explicit opt-in peek (e.g. social without email match).
  const pendingByEmail = getPendingHomeCountryFromMatchingEmail(email);
  const pendingByPeek = usePendingHomeCountry ? peekPendingHomeCountry() : null;
  const hc = explicitHc ?? pendingByEmail ?? pendingByPeek;
  if (hc) {
    body.homeCountryCode = hc;
  }

  const res = await apiPost(
    `${base}/api/Users/me/ensure-profile`,
    body,
    { showLoader: false },
  );

  if (res.ok) {
    clearPendingHomeCountry();
  }

  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    return null;
  }
  return res.json();
}

/**
 * Records a profile view when the current user opens someone else's profile.
 * Sends a notification to the profile owner. Skips if already viewed in last 24h.
 * @param {string} profileUserId - The profile owner being viewed
 * @returns {Promise<{ recorded: boolean }>}
 */
export async function recordProfileView(profileUserId) {
  const res = await apiPost(`${base}/api/Users/${encodeURIComponent(profileUserId)}/profile-view`, null, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {
      return { recorded: false };
    }
    return { recorded: false };
  }
  return res.json();
}

/**
 * Gets who viewed your profile (recent viewers with profile info). Only for own profile.
 * @param {number} [limit=10]
 * @returns {Promise<{ viewers: Array, totalCount: number }>}
 */
export async function getProfileViewers(limit = 10) {
  const res = await apiGet(`${base}/api/Users/me/profile-views?limit=${limit}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {
      return { viewers: [], totalCount: 0 };
    }
    return { viewers: [], totalCount: 0 };
  }
  return res.json();
}

/**
 * Saves home market (ISO alpha-2) for the signed-in user during onboarding only.
 * @param {string | null | undefined} countryCode
 */
export async function putUserHomeCountry(countryCode) {
  const trimmed = countryCode === null || countryCode === undefined ? '' : String(countryCode).trim();
  const body = trimmed === '' ? { countryCode: null } : { countryCode: trimmed.toUpperCase() };
  const res = await apiPut(`${base}/api/Users/me/home-country`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.message || res.statusText || 'Failed to save home country';
    const error = new Error(message);
    error.status = res.status;
    error.code = res.status === 409 ? 'HOME_COUNTRY_LOCKED' : undefined;
    throw error;
  }
}
