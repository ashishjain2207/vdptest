# Why Some Features Work Locally But Not in Dev Environment

When you run the app **locally** (`npm run dev` at `http://localhost:5173`), Vite sets `import.meta.env.DEV` to **true**. When the app is **built and deployed** (e.g. to https://dev.app.vdpconnect.idxd.de), the build has `import.meta.env.DEV` set to **false**. That and infrastructure differences often explain why something works on your machine but not in the dev deployment.

## 1. **Different URLs (config)**

| | Local | Dev (deployed) |
|---|--------|------------------|
| **Frontend** | http://localhost:5173 | https://dev.app.vdpconnect.idxd.de |
| **API** | http://localhost:5225 (or Vite proxy) | https://dev.api.vdpconnect.idxd.de |
| **Auth** | https://localhost:5001 | https://dev.auth.vdpconnect.idxd.de |
| **Callback / redirect** | http://localhost:5173/callback | https://dev.app.vdpconnect.idxd.de/callback |

- **Check:** For the **dev build**, ensure the build is done with the correct env (or no override), so the app uses the dev API and auth URLs above. If you build with `VITE_API_BASE_URL=http://localhost:5225`, the deployed app will still call localhost and fail.
- **Check:** Auth (Identity) must have the **dev app URL** registered as a valid redirect/callback (e.g. `https://dev.app.vdpconnect.idxd.de/callback`). If only localhost is registered, login will work locally but not in dev.

## 2. **SignalR / WebSockets**

Real-time features (live presence, notifications, chat) use SignalR. Locally there is no proxy; in dev they go through a reverse proxy (e.g. Nginx).

- **Client behaviour:** In **deployed** dev/prod builds, the frontend uses **SSE (Server-Sent Events)** only for SignalR—it does not attempt WebSockets. This avoids console errors when the proxy or load balancer does not support WebSockets correctly. Real-time still works over SSE. Locally (`npm run dev`), the app still tries WebSockets first for better performance.
- **If you want WebSockets in dev:** The proxy must support **WebSocket upgrade** for the hub paths (e.g. `/hubs/messages`, `/hubs/notifications`): correct `Upgrade` and `Connection` headers and long enough timeouts. If the **API runs on more than one instance** behind a load balancer, **sticky sessions (session affinity)** are required for SignalR.
- See the API repo’s `deploy/README.md` (or equivalent) for “Multiple API servers” and SignalR.

## 3. **CORS**

The dev API must allow the **dev frontend origin** (e.g. `https://dev.app.vdpconnect.idxd.de`). Locally, the dev server often proxies to the API, so the browser sees same-origin requests and CORS is not an issue.

- **Check:** API CORS configuration includes the exact dev app URL (and optionally `https://dev.app.vdpconnect.idxd.de` without trailing slash, depending on server behavior).
- **Check:** Browser console/Network for CORS errors when a feature fails in dev.

## 4. **Cookies and auth**

Auth tokens and cookies are tied to the origin. Locally you use `localhost`; in dev you use `dev.app.vdpconnect.idxd.de`.

- **Check:** Cookie settings (e.g. **SameSite**, **Secure**) must be valid for the dev domain. If cookies are not sent on the dev domain, the app will look “logged out” or fail API calls.
- **Check:** Identity (auth server) is configured to issue tokens for the **dev API** audience and to accept the **dev app** as a valid client/redirect.

## 5. **Code that only runs when `import.meta.env.DEV` is true**

Some logic runs **only in local dev** (when `import.meta.env.DEV` is true), for example:

- **ProfileSettings:** Sending `X-Test-User-Id` in request headers (for local API testing). In dev that header is not sent; the API should identify the user from the JWT instead.
- **AuthContext / Signup / ResetPassword / ForgotPassword / VerifyEmail:** Different URLs or branches when `DEV` is true (e.g. local Identity vs dev.auth). In a built app, the non-DEV branch is used.

If a feature is implemented only inside a `if (import.meta.env.DEV) { ... }` block, it will **never** run in the deployed dev build. Fix by either moving the behavior out of the DEV check or duplicating it for the dev environment (e.g. with a separate env like `VITE_APP_ENV=development`), depending on product needs.

## 6. **Build-time environment variables**

Vite bakes `VITE_*` variables into the bundle at **build time**. The deployed dev app gets whatever was set when the Docker (or CI) image was built.

- **Check:** In your deployment pipeline, the build step has the right values for:
  - `VITE_API_BASE_URL` (or unset so default `https://dev.api.vdpconnect.idxd.de` is used)
  - `VITE_OIDC_ISSUER` (or unset for default dev.auth)
  - `VITE_OIDC_REDIRECT_URI` (or unset for default dev app callback)
- **Check:** No leftover local values (e.g. `http://localhost:5225`) in the build args for the dev deployment.

## 7. **Quick checklist when a feature works locally but not in dev**

1. **Browser console and Network tab** – CORS, 401/403, 404, or WebSocket errors.
2. **Auth** – Redirect/callback and client config in Identity for the dev app URL; cookies and token audience for the dev API.
3. **API** – CORS allows the dev frontend origin; no dependency on `X-Test-User-Id` or other local-only headers for that feature.
4. **SignalR** – Proxy supports WebSockets and long timeouts; sticky sessions if the API is behind a load balancer.
5. **Build** – No localhost or wrong env in the image used for dev deployment.

If you know the **exact feature** that fails in dev (e.g. “login”, “live presence”, “post creation”), you can narrow this down (e.g. auth vs API vs SignalR) and then check the matching section above and the corresponding server/config.
