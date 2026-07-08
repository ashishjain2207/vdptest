/**
 * API and OAuth configuration.
 * In dev we use relative /m/... (proxied by Vite) to avoid CORS. In prod use full URL.
 */
export const config = {
  oauth: {
    tokenUrl:
      (import.meta.env.DEV ? '/m/oauth2/token' : null) ||
      import.meta.env.VITE_OAUTH_TOKEN_URL ||
      'https://idxd.de/m/oauth2/token',
    clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_OAUTH_CLIENT_SECRET || '',
    scope: import.meta.env.VITE_OAUTH_SCOPE || 'market',
  },
  oidc: {
    // Dev: local Imriva.Identity.Host (https://localhost:5001). Prod build: hosted dev auth unless VITE_OIDC_ISSUER is set. Align API Jwt:Authority with the issuer you use.
    authBase: (
      import.meta.env.VITE_OIDC_ISSUER
      || (import.meta.env.DEV ? 'https://localhost:5001' : 'https://dev.auth.vdpconnect.idxd.de')
    ).replace(/\/$/, ''),
    issuer:
      import.meta.env.VITE_OIDC_ISSUER
      || (import.meta.env.DEV ? 'https://localhost:5001' : 'https://dev.auth.vdpconnect.idxd.de'),
    clientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'imriva-frontend',
    redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI || (import.meta.env.DEV ? 'http://localhost:5173/callback' : 'https://dev.app.vdpconnect.idxd.de/callback'),
    scope: import.meta.env.VITE_OIDC_SCOPE || 'openid profile api',
    loginUrl: import.meta.env.VITE_OIDC_LOGIN_URL || (import.meta.env.DEV ? 'http://localhost:5173/login' : 'https://dev.app.vdpconnect.idxd.de/login'),
  },
  api: {
    // Same rules as @/lib/config API_BASE: empty in dev (proxy); env or default in prod.
    baseUrl: import.meta.env.DEV
      ? ''
      : (import.meta.env.VITE_API_BASE_URL || 'https://dev.api.vdpconnect.idxd.de').replace(/\/$/, ''),
  },
  session: {
    /** Idle timeout in ms (15 minutes) */
    idleTimeoutMs: 15 * 60 * 1000,
    /** Absolute timeout in ms (1 hour) */
    absoluteTimeoutMs: 60 * 60 * 1000,
    storageKey: 'vdpconnect_session',
    tokenKey: 'vdpconnect_tokens',
  },
};
