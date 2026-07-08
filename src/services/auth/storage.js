import { config } from '../config.js';

const TOKEN_KEY = config.session.tokenKey;
const SESSION_KEY = config.session.storageKey;

/**
 * Token payload from OAuth2 token endpoint.
 * @typedef {{ access_token: string, refresh_token?: string, expires_in?: number, token_type?: string }} TokenPayload
 */

/**
 * @returns {TokenPayload | null}
 */
export function getStoredTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {TokenPayload & { obtained_at?: number }} tokens
 */
export function setStoredTokens(tokens) {
  const merged = { ...tokens, obtained_at: tokens.obtained_at ?? Date.now() };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(merged));
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * @returns {{ lastActivity: number, loginTimestamp?: number, user?: object } | null}
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ lastActivity: number, loginTimestamp?: number, user?: object }} session
 */
export function setSession(session) {
  // Preserve loginTimestamp if not provided
  const existing = getSession();
  const loginTimestamp = session.loginTimestamp ?? existing?.loginTimestamp;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ 
    ...session, 
    lastActivity: session.lastActivity ?? Date.now(),
    loginTimestamp, 
  }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function clearAuth() {
  clearStoredTokens();
  clearSession();
}
