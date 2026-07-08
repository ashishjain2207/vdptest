/**
 * Authentication service for Imriva Identity / OpenIddict.
 * Handles password grant and external provider authentication.
 */

import { config } from '../config.js';
import { getStoredTokens, setStoredTokens, clearAuth } from './storage.js';
import { setHomeCountryCode } from '@/lib/activeCountry.js';

const TOKEN_KEY = config.session.tokenKey;
/** @deprecated Migrated to {@link TOKEN_KEY} on read/write. */
const LEGACY_SESSION_TOKEN_KEY = 'oidc_tokens';

/**
 * @param {{ access_token: string, refresh_token?: string, expires_in?: number, token_type?: string, obtained_at?: number }} tokens
 */
function persistAuthTokens(tokens) {
  const tokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    token_type: tokens.token_type,
    obtained_at: tokens.obtained_at ?? Date.now(),
  };
  const raw = JSON.stringify(tokenData);
  sessionStorage.setItem(TOKEN_KEY, raw);
  sessionStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
  setStoredTokens({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
    obtained_at: tokenData.obtained_at,
  });
}

/** @returns {Record<string, unknown> | null} */
function readSessionTokenData() {
  const raw = sessionStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY);
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw);
    if (sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY) && !sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, raw);
      sessionStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
    }
    return data;
  } catch {
    return null;
  }
}
const RETURN_URL_KEY = 'oidc_return_url';
/** Prevents a second token exchange for the same authorization code (React effect re-run / duplicate callback). */
const OIDC_EXCHANGED_CODE_KEY = 'oidc_exchanged_code';
const PENDING_HOME_SOCIAL_SIGNUP_KEY = 'pendingHomeCountrySocialSignup';
const PENDING_HOME_SOCIAL_SIGNUP_STATE_KEY = 'pendingHomeCountrySocialSignupState';
/** Same key as LanguageContext - used to persist language across OAuth redirects */
const LANGUAGE_STORAGE_KEY = 'vdpconnect_language';

const { authBase, issuer, clientId, redirectUri, scope } = config.oidc;

/** Shown when Identity rejects login/refresh because the account is suspended. */
export const ACCOUNT_SUSPENDED_MESSAGE =
  'Your account has been suspended. Please contact support.';

/** Token/userinfo base: Vite `/api-identity` proxy in dev; direct issuer URL in production builds. */
function getTokenAndUserinfoBase() {
  if (import.meta.env.DEV) {
    return '/api-identity';
  }

  return authBase ?? issuer.replace(/\/$/, '');
}

/**
 * Get stored language from localStorage (for OAuth state). Default DE.
 * @returns {'EN'|'DE'}
 */
function getStoredLanguageForOAuth() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'EN' || stored === 'DE') {
      return stored;
    }
  } catch (_e) { /* ignore */ }
  return 'DE';
}

/**
 * Generate a random string for state.
 * @param {number} length - Length of the string to generate.
 * @returns {string} Random string.
 */
function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);
  for (let i = 0; i < length; i++) {
    result += chars[random[i] % chars.length];
  }
  return result;
}

/**
 * Compute SHA-256 hash and return base64url encoded string.
 * @param {string} input - Input string to hash.
 * @returns {Promise<string>} Base64url encoded hash.
 */
async function sha256Base64Url(input) {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** In-flight exchange for the current authorization code (dedupes parallel handleCallback calls). */
let oauthCodeExchangePromise = null;
let oauthCodeExchangeCode = null;

function isAuthorizationCodeAlreadyRedeemedError(errorCode, errorDescription) {
  const desc = String(errorDescription ?? '').toLowerCase();
  return errorCode === 'invalid_grant'
    && (desc.includes('already been redeemed') || desc.includes('already redeemed'));
}

function buildCallbackSuccessFromStoredTokens(state, restoredLanguage) {
  const sessionData = readSessionTokenData();
  const stored = getStoredTokens();
  const tokenSource = sessionData?.access_token && !isAccessTokenExpired(sessionData)
    ? sessionData
    : (stored?.access_token && !isAccessTokenExpired(stored) ? stored : null);
  if (!tokenSource?.access_token) {
    return null;
  }

  const returnUrl = sessionStorage.getItem(RETURN_URL_KEY) ?? '/';
  sessionStorage.removeItem(RETURN_URL_KEY);
  return {
    tokens: tokenSource,
    returnUrl,
    restoredLanguage: restoredLanguage ?? undefined,
    oauthState: state,
  };
}

/**
 * Handle callback from external auth or authorization code flow.
 * @param {URLSearchParams} searchParams - URL search parameters from callback.
 * @returns {Promise<{ tokens?: object, error?: string, errorDescription?: string, returnUrl?: string }>} Result object.
 */
export async function handleCallback(searchParams) {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    sessionStorage.removeItem('oidc_code_verifier');
    sessionStorage.removeItem('oidc_state');
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return { 
      error: error, 
      errorDescription: searchParams.get('error_description'),
      returnUrl: returnUrl || '/',
    };
  }

  if (!code || !state) {
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return { error: 'missing_code_or_state', returnUrl: returnUrl || '/' };
  }

  if (oauthCodeExchangeCode === code && oauthCodeExchangePromise) {
    return oauthCodeExchangePromise;
  }

  const savedState = sessionStorage.getItem('oidc_state');
  const codeVerifier = sessionStorage.getItem('oidc_code_verifier');
  if (savedState !== state || !codeVerifier) {
    const exchangedCode = sessionStorage.getItem(OIDC_EXCHANGED_CODE_KEY);
    if (exchangedCode === code) {
      let restoredLanguage = null;
      const stateParts = state.split('|');
      if (stateParts.length >= 2 && (stateParts[1] === 'EN' || stateParts[1] === 'DE')) {
        restoredLanguage = stateParts[1];
      }
      const recovered = buildCallbackSuccessFromStoredTokens(state, restoredLanguage);
      if (recovered) {
        return recovered;
      }
    }

    sessionStorage.removeItem('oidc_code_verifier');
    sessionStorage.removeItem('oidc_state');
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return { error: 'invalid_state', returnUrl: returnUrl || '/' };
  }

  oauthCodeExchangeCode = code;
  oauthCodeExchangePromise = exchangeAuthorizationCode(code, state, codeVerifier).finally(() => {
    oauthCodeExchangePromise = null;
    oauthCodeExchangeCode = null;
  });
  return oauthCodeExchangePromise;
}

/**
 * @param {string} code
 * @param {string} state
 * @param {string} codeVerifier
 */
async function exchangeAuthorizationCode(code, state, codeVerifier) {
  const exchangedCode = sessionStorage.getItem(OIDC_EXCHANGED_CODE_KEY);
  if (exchangedCode === code) {
    let restoredLanguage = null;
    const stateParts = state.split('|');
    if (stateParts.length >= 2 && (stateParts[1] === 'EN' || stateParts[1] === 'DE')) {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, stateParts[1]);
        restoredLanguage = stateParts[1];
      } catch (_e) { /* ignore */ }
    }
    const recovered = buildCallbackSuccessFromStoredTokens(state, restoredLanguage);
    if (recovered) {
      return recovered;
    }
  }

  // Restore user's language preference from OAuth state (user selected before redirect)
  let restoredLanguage = null;
  const stateParts = state.split('|');
  if (stateParts.length >= 2 && (stateParts[1] === 'EN' || stateParts[1] === 'DE')) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, stateParts[1]);
      restoredLanguage = stateParts[1];
    } catch (_e) { /* ignore */ }
  }

  const tokenUrl = `${getTokenAndUserinfoBase()}/connect/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    client_id: clientId,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  sessionStorage.removeItem('oidc_code_verifier');
  sessionStorage.removeItem('oidc_state');

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY) ?? '/';
    sessionStorage.removeItem(RETURN_URL_KEY);
    const errorCode = err.error ?? 'token_exchange_failed';
    const errorDescription = err.error_description;
    if (isAuthorizationCodeAlreadyRedeemedError(errorCode, errorDescription)) {
      const recovered = buildCallbackSuccessFromStoredTokens(state, restoredLanguage);
      if (recovered) {
        return recovered;
      }
    }

    return { 
      error: errorCode, 
      errorDescription,
      returnUrl,
    };
  }

  const tokens = await res.json();
  const tokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    token_type: tokens.token_type,
    obtained_at: Date.now(),
  };

  persistAuthTokens(tokenData);
  sessionStorage.setItem(OIDC_EXCHANGED_CODE_KEY, code);

  const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
  
  return { 
    tokens: tokenData,
    returnUrl: returnUrl || '/',
    restoredLanguage: restoredLanguage ?? undefined,
    oauthState: state,
  };
}

/**
 * Initiate external provider login (Google/Microsoft/LinkedIn).
 * @param {string} provider - Provider name ('google', 'microsoft', or 'linkedin').
 * @param {string} [returnUrl] - Optional return URL to redirect to after successful authentication.
 * @param {{ pendingHomeCountrySignup?: boolean }} [options]
 */
export async function loginWithExternalProvider(provider, returnUrl, options = {}) {
  // Avoid treating a previous session's cached market as the new user's home country.
  setHomeCountryCode(null);

  const csrf = randomString(32);
  const lang = getStoredLanguageForOAuth();
  const state = `${csrf}|${lang}`;
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);

  sessionStorage.setItem('oidc_code_verifier', codeVerifier);
  sessionStorage.setItem('oidc_state', state);
  if (options.pendingHomeCountrySignup && sessionStorage.getItem(PENDING_HOME_SOCIAL_SIGNUP_KEY) === '1') {
    sessionStorage.setItem(PENDING_HOME_SOCIAL_SIGNUP_STATE_KEY, state);
  } else {
    sessionStorage.removeItem(PENDING_HOME_SOCIAL_SIGNUP_STATE_KEY);
  }
  
  // Store returnUrl if provided, or check if one is already stored
  if (returnUrl) {
    sessionStorage.setItem(RETURN_URL_KEY, returnUrl);
  } else {
    // Check if returnUrl is already stored (e.g., from Login page)
    const storedReturnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    if (!storedReturnUrl) {
      // No returnUrl provided or stored, use default
      sessionStorage.removeItem(RETURN_URL_KEY);
    }
  }

  // Build authorize URL with PKCE parameters for external auth flow
  const authorizeParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });
  const authorizeUrl = `${issuer.replace(/\/$/, '')}/connect/authorize?${authorizeParams.toString()}`;

  // Redirect to Identity's external provider endpoint; returnUrl must be a query parameter (not path).
  const base = issuer.replace(/\/$/, '');
  const externalUrl = `${base}/connect/external/${provider}?returnUrl=${encodeURIComponent(authorizeUrl)}`;

  window.location.href = externalUrl;
}

/**
 * @param {string} token - JWT access token.
 * @returns {Record<string, unknown> | null} Parsed payload claims, or null.
 */
function parseJwtPayload(token) {
  if (!token) {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/** OIDC platform administrator role (must match Identity + API Admin policy). */
export const PLATFORM_ADMIN_ROLE = 'VdpConnect.Admin';

/** Platform support staff (inbox + read-only admin modules). */
export const PLATFORM_SUPPORT_ROLE = 'VdpConnect.Support';

/**
 * Platform roles from JWT (Identity / OpenIddict). Used for UI and must match API Jwt:RoleClaimType / Admin policy.
 * @param {string} token - JWT access token.
 * @returns {string[]} Distinct role names.
 */
export function getRolesFromAccessToken(token) {
  const claims = parseJwtPayload(token);
  if (!claims || typeof claims !== 'object') {
    return [];
  }
  const keys = [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ];
  const out = [];
  for (const k of keys) {
    const v = claims[k];
    if (v === null || v === undefined) {
      continue;
    }
    if (Array.isArray(v)) {
      out.push(...v.map((x) => String(x)));
    } else {
      out.push(String(v));
    }
  }
  return [...new Set(out.map((s) => s.trim()).filter(Boolean))];
}

/**
 * @param {string} token - JWT access token.
 * @returns {{ platformRoles: string[], isPlatformAdmin: boolean, isPlatformSupport: boolean, isPlatformStaff: boolean }}
 */
export function getPlatformAuthFromToken(token) {
  const platformRoles = getRolesFromAccessToken(token);
  const isPlatformAdmin = platformRoles.some((r) => {
    const t = String(r).trim();
    if (!t) {
      return false;
    }
    return t.toLowerCase() === PLATFORM_ADMIN_ROLE.toLowerCase();
  });
  const isPlatformSupport = platformRoles.some((r) => {
    const t = String(r).trim();
    if (!t) {
      return false;
    }
    return t.toLowerCase() === PLATFORM_SUPPORT_ROLE.toLowerCase();
  });
  return {
    platformRoles,
    isPlatformAdmin,
    isPlatformSupport,
    isPlatformStaff: isPlatformAdmin || isPlatformSupport,
  };
}

/**
 * Decode JWT token and extract user ID from "sub" claim or alternative claims.
 * @param {string} token - JWT token string.
 * @returns {string | null} User ID from "sub" claim or alternative claims, or null if not found/invalid.
 */
export function getUserIdFromToken(token) {
  const claims = parseJwtPayload(token);
  if (!claims) {
    return null;
  }

  try {
    // Try to extract user ID from various possible claims
    // Priority: sub > nameid > unique_name > preferred_username > email (if it looks like a GUID)
    let userId = claims.sub || 
                 claims.nameid || 
                 claims.unique_name || 
                 claims.preferred_username ||
                 null;
    
    // If we have an email but no userId, and email looks like it might be a user identifier
    // (this is a fallback, but usually we want sub/nameid)
    if (!userId && claims.email) {
      // Check if email contains a GUID pattern (for some systems)
      const guidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      if (guidPattern.test(claims.email)) {
        userId = claims.email.match(guidPattern)[0];
      }
    }
    
    return userId;
  } catch (_error) {
    return null;
  }
}

/** Clock skew only — token is still sent to the API until real expiry (apiRequest refreshes on 401). */
const ACCESS_TOKEN_EXPIRY_SKEW_MS = 5000;

function isAccessTokenExpired(data) {
  if (!data?.access_token) {
    return true;
  }
  const payload = parseJwtPayload(data.access_token);
  if (payload && typeof payload.exp === 'number') {
    return Date.now() >= ((payload.exp * 1000) - ACCESS_TOKEN_EXPIRY_SKEW_MS);
  }
  if (data.expires_in !== null && data.expires_in !== undefined && data.obtained_at !== null && data.obtained_at !== undefined) {
    const expiresAt = data.obtained_at + (data.expires_in * 1000);
    return Date.now() >= expiresAt - ACCESS_TOKEN_EXPIRY_SKEW_MS;
  }
  return false;
}

/**
 * Get stored access token (for API calls).
 * @returns {string | null} Access token or null if not available/expired.
 */
export function getAccessToken() {
  try {
    const sessionData = readSessionTokenData();
    if (sessionData?.access_token && !isAccessTokenExpired(sessionData)) {
      return sessionData.access_token;
    }

    const tokens = getStoredTokens();
    if (tokens?.access_token && !isAccessTokenExpired(tokens)) {
      persistAuthTokens(tokens);
      return tokens.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves the Identity subject used for VdpConnect (UserProfiles.UserId, /api/Users/{id}, ensure-profile).
 * Must match the JWT "sub" (or nameid) the API reads from the Bearer token — prefer token claims over userinfo.sub when both exist.
 * @param {string | null} accessToken
 * @param {{ sub?: string } | null | undefined} [userInfo]
 * @returns {string | null}
 */
export function resolveVdpConnectUserId(accessToken, userInfo) {
  const fromJwt = accessToken ? getUserIdFromToken(accessToken) : null;
  const fromUserInfo = userInfo?.sub ?? null;
  if (fromJwt && fromUserInfo && fromJwt !== fromUserInfo) {
    if (import.meta.env.DEV) {
      console.warn('[VdpConnect] userinfo.sub differs from JWT subject; using JWT for profile API.', { fromJwt, fromUserInfo });
    }
  }
  return fromJwt ?? fromUserInfo ?? null;
}

/**
 * Refresh tokens using refresh_token (no PKCE; client_id only).
 * @returns {Promise<string | null>} New access token or null if refresh failed.
 */
export async function refreshTokens() {
  try {
    const sessionData = readSessionTokenData();
    let storedRefreshToken = sessionData?.refresh_token ?? null;
    if (!storedRefreshToken) {
      const tokens = getStoredTokens();
      storedRefreshToken = tokens?.refresh_token ?? null;
    }
    
    if (!storedRefreshToken) {
      return null;
    }

    const tokenUrl = `${getTokenAndUserinfoBase()}/connect/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: storedRefreshToken,
      client_id: clientId,
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.error === 'account_suspended') {
        clearAuth();
        const suspended = new Error(ACCOUNT_SUSPENDED_MESSAGE);
        suspended.code = 'ACCOUNT_SUSPENDED';
        throw suspended;
      }
      return null;
    }

    const tokens = await res.json();
    persistAuthTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? storedRefreshToken,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      obtained_at: Date.now(),
    });

    return getAccessToken();
  } catch (err) {
    if (err?.code === 'ACCOUNT_SUSPENDED') {
      throw err;
    }
    return null;
  }
}

/**
 * Returns a valid access token, refreshing with refresh_token when the access token is missing or expired.
 * @returns {Promise<string | null>}
 */
export async function ensureAccessToken() {
  const t = getAccessToken();
  if (t) {
    return t;
  }
  await refreshTokens();
  return getAccessToken();
}

/**
 * Logout: clear tokens and session data.
 */
export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
  sessionStorage.removeItem('oidc_code_verifier');
  sessionStorage.removeItem('oidc_state');
  sessionStorage.removeItem(RETURN_URL_KEY);
  clearAuth();
}

/**
 * Refresh access token using refresh_token grant (alias for refreshTokens for backward compatibility).
 * @returns {Promise<{ access_token: string, refresh_token?: string, expires_in?: number }>}
 */
export async function refreshToken() {
  const newToken = await refreshTokens();
  if (!newToken) {
    throw new Error('Token refresh failed');
  }
  const tokens = getStoredTokens();
  return {
    access_token: newToken,
    refresh_token: tokens?.refresh_token,
    expires_in: tokens?.expires_in,
  };
}

/**
 * True if the string should not be shown as a person's display name (e.g. full email).
 * @param {string} s
 * @returns {boolean}
 */
function isPlausiblePersonDisplayName(s) {
  if (typeof s !== 'string') {
    return false;
  }
  const t = s.trim();
  if (!t) {
    return false;
  }
  // Never treat email (or OIDC "name" set to username/email) as display name in the UI.
  if (t.includes('@')) {
    return false;
  }
  return true;
}

/**
 * Resolves a human display name from userinfo or JWT payload shape (snake_case / camelCase).
 * Does not use preferred_username or email — those are identifiers, not display names.
 * @param {Record<string, unknown> | null | undefined} claims
 * @returns {string | null}
 */
function resolveDisplayNameFromClaimsObject(claims) {
  if (!claims || typeof claims !== 'object') {
    return null;
  }
  const candidates = [
    claims.display_name,
    claims.displayName,
    claims.name,
    claims.given_name && claims.family_name
      ? `${String(claims.given_name).trim()} ${String(claims.family_name).trim()}`.trim()
      : null,
    claims.given_name,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string') {
      continue;
    }
    const t = c.trim();
    if (isPlausiblePersonDisplayName(t)) {
      return t;
    }
  }
  return null;
}

/**
 * Display name from JWT access token (Identity/OpenIddict claims: display_name, name, given_name, …).
 * Never returns an email string; returns null if only email-like values exist.
 * @param {string | null} accessToken
 * @returns {string | null}
 */
export function getDisplayNameFromAccessToken(accessToken) {
  return resolveDisplayNameFromClaimsObject(parseJwtPayload(accessToken));
}

/**
 * Preferred helper for session/UI: userinfo first, then JWT. Never uses email as display name.
 * @param {object | null | undefined} userInfo - /connect/userinfo JSON
 * @param {string | null} accessToken - Bearer access token (optional)
 * @returns {string}
 */
export function getDisplayNameForSession(userInfo, accessToken) {
  const fromUserInfo = resolveDisplayNameFromClaimsObject(userInfo);
  if (fromUserInfo) {
    return fromUserInfo;
  }
  const fromJwt = getDisplayNameFromAccessToken(accessToken);
  if (fromJwt) {
    return fromJwt;
  }
  return 'User';
}

/**
 * Get display name from Identity userinfo (supports snake_case and camelCase).
 * Uses display_name / name / given_name; never uses email or preferred_username.
 * @param {object} userInfo - User info from /connect/userinfo.
 * @returns {string} Display name or 'User' if none.
 */
export function getDisplayNameFromUserInfo(userInfo) {
  return resolveDisplayNameFromClaimsObject(userInfo) ?? 'User';
}

/**
 * Get preferred handle (username) from Identity userinfo.
 * @param {object} userInfo - User info from /connect/userinfo.
 * @returns {string|null} Handle or null if none.
 */
export function getHandleFromUserInfo(userInfo) {
  const h = userInfo?.handle ?? userInfo?.preferred_handle ?? '';
  return (typeof h === 'string' && h.trim()) ? h.trim() : null;
}

/**
 * Get email from Identity userinfo (for API profile linking / contactEmail).
 * @param {object} userInfo - User info from /connect/userinfo.
 * @returns {string|null}
 */
export function getEmailFromUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') {
    return null;
  }
  const e = userInfo.email ?? userInfo.Email;
  if (typeof e === 'string' && e.trim()) {
    return e.trim();
  }
  const preferred = userInfo.preferred_username ?? '';
  if (typeof preferred === 'string' && preferred.includes('@')) {
    return preferred.trim();
  }
  return null;
}

/**
 * Whether the user can change email/password in account settings.
 * Missing has_password in userinfo defaults to true (password-capable); only explicit false disables controls.
 * @param {{ has_password?: boolean, hasPassword?: boolean } | null | undefined} userInfo
 * @returns {boolean | null} null when userInfo is absent
 */
export function resolveHasPasswordFromUserInfo(userInfo) {
  if (!userInfo) {
    return null;
  }

  const raw = userInfo.has_password ?? userInfo.hasPassword;
  return raw !== false;
}

/**
 * Get user information from identity API using access token.
 * @param {string} accessToken - Access token to use for authentication.
 * @returns {Promise<{ sub?: string, email?: string, preferred_username?: string, display_name?: string, project_category?: string, has_password?: boolean } | null>} User info object or null if failed.
 */
export async function getUserInfoFromIdentity(accessToken) {
  if (!accessToken) {
    return null;
  }

  try {
    const userinfoUrl = `${getTokenAndUserinfoBase()}/connect/userinfo`;
    
    const response = await fetch(userinfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const userInfo = await response.json();
    return userInfo;
  } catch (_error) {
    return null;
  }
}

/**
 * Decode the JWT access token payload and return the 'sub' claim (user id).
 * Used as fallback when /connect/userinfo fails so the UI can still show the user as logged in.
 * No signature verification (token was issued by our Identity server).
 * @param {string} accessToken - JWT access token.
 * @returns {string|null} User id (sub) or null if token is invalid or missing sub.
 */
export function getSubFromAccessToken(accessToken) {
  const payload = parseJwtPayload(accessToken);
  return payload?.sub ?? null;
}

/**
 * Read email (or email-like preferred_username) from JWT access token payload.
 * Used when userinfo is unavailable but the token still carries email claims.
 * @param {string} accessToken
 * @returns {string|null}
 */
export function getEmailFromAccessToken(accessToken) {
  const payload = parseJwtPayload(accessToken);
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const e = payload.email;
  if (typeof e === 'string' && e.trim()) {
    return e.trim();
  }
  const pref = payload.preferred_username;
  if (typeof pref === 'string' && pref.includes('@')) {
    return pref.trim();
  }
  return null;
}

/**
 * Login with username and password using password grant type.
 * @param {string} username - Username or email.
 * @param {string} password - User password.
 * @returns {Promise<{ tokens?: object, error?: string, errorDescription?: string }>} Result object.
 */
export async function loginWithPassword(username, password) {
  if (!username || !password) {
    return { error: 'missing_credentials', errorDescription: 'Username and password are required' };
  }

  const tokenUrl = `${getTokenAndUserinfoBase()}/connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    username: username,
    password: password,
    scope: scope,
    client_id: clientId,
  });

  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorText = await res.text().catch(() => '');
      return { 
        error: err.error ?? 'login_failed', 
        errorDescription: err.error_description ?? err.title ?? errorText ?? 'Invalid username or password', 
      };
    }

    const tokens = await res.json();
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      obtained_at: Date.now(),
    };

    persistAuthTokens(tokenData);

    return { tokens: tokenData };
  } catch (err) {
    return { 
      error: 'network_error', 
      errorDescription: err instanceof Error ? err.message : 'Network error occurred', 
    };
  }
}
