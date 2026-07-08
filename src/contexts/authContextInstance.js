import { createContext, useContext } from 'react';

const AUTH_CONTEXT_GLOBAL_KEY = '__imrivaVdpConnectAuthContext__';
const MISSING_AUTH_CONTEXT = Symbol.for('imriva.vdpconnect.AuthContext.missing');

export const defaultAuthValue = Object.freeze({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: false,
  error: null,
  clearError: () => {},
});

function resolveAuthContext() {
  const scope = globalThis;
  if (!scope[AUTH_CONTEXT_GLOBAL_KEY]) {
    scope[AUTH_CONTEXT_GLOBAL_KEY] = createContext(MISSING_AUTH_CONTEXT);
  }
  return scope[AUTH_CONTEXT_GLOBAL_KEY];
}

/** Single React context instance for the whole app (survives duplicate module evaluation in dev/HMR). */
export const AuthContext = resolveAuthContext();

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === MISSING_AUTH_CONTEXT) {
    if (import.meta.env.DEV) {
      console.warn('useAuth called outside AuthProvider - returning default. Ensure AuthProvider wraps your app.');
    }
    return defaultAuthValue;
  }
  return ctx;
}
