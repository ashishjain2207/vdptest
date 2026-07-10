# E2E Scope

## Purpose
- UI branding in this repo is `vdpConnect`; `package.json` name is `vite_react_shadcn`.
- Stack in this checkout: Vite, React 18, React Router, Redux Toolkit, TanStack Query, Tailwind CSS, and Playwright referenced from `package.json`.
- IMRIVA reads this file first before opening `src/`.
- Scenarios come from ClickUp at GENERATE SCRIPTS; this file documents the repo only.

## E2E status today
- `e2e/` exists: **no**
- IMRIVA will scaffold `e2e/` on GENERATE SCRIPTS.

## Read order
1. `E2E_SCOPE.md`
2. `.cursorignore`
3. `src/App.jsx`
4. `src/pages/Login.jsx`
5. `src/components/layout/Sidebar.jsx`
6. `src/pages/Index.jsx`
7. `src/components/ui/sidebar.jsx`
8. `src/components/ui/ClearableSearchInput.jsx`
9. `src/lib/appRoutes.js`
10. `package.json`

## Selector sources (read-only)
| Path | Contains | Selector hints |
|------|----------|----------------|
| `src/pages/Login.jsx` | Login screen, social auth buttons, email/password form, forgot-password link | `#email`, `#password`, `a[href="/forgot-password"]`, button text from `auth.signIn`, password toggle `button[aria-label]`, maintenance banner `role="status"` |
| `src/components/layout/Sidebar.jsx` | Authenticated app navigation | `a[aria-label="VDPConnect home"]`, nav links to `/posts`, `/explore`, `/people`, `/partners`, `/admin`, `/events`, `/messages`, `/notifications`, `/bookmarks`, `/settings` |
| `src/components/ui/sidebar.jsx` | Reusable sidebar primitives | `[data-testid="sidebar-trigger"]`, `button[aria-label="Toggle sidebar"]`, `[data-sidebar="sidebar"]`, `[data-sidebar="menu-button"]` |
| `src/components/ui/ClearableSearchInput.jsx` | Stable search input wrapper for E2E-friendly selectors | input `data-testid` from `dataTestId`, `${dataTestId}-root`, `${dataTestId}-clear`, fallback `aria-label` from placeholder |

Do not modify files under `src/`.

## Routes / navigation
- Router file: `src/App.jsx`
- Public/auth routes seen in router: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/callback`, `/verify-email`, `/support`, `/maintenance`
- Authenticated routes seen in router: `/posts`, `/explore`, `/people`, `/profile/:userId`, `/partners`, `/admin`, `/events`, `/event/:id`, `/messages`, `/notifications`, `/bookmarks`, `/settings`
- `/` redirects to `/posts`
- There is no literal `/dashboard` route in the current router
- Canonical helper paths are in `src/lib/appRoutes.js`

## Write scope (IMRIVA creates - do not create now)
- `e2e/tests/`
- `e2e/pages/`
- `e2e/fixtures/`
- `e2e/test-data/`
- `e2e/utils/`
- `e2e/playwright.config.ts`
- `e2e/README.md`
- `.github/workflows/playwright-e2e.yml`

## Do not explore
- `node_modules/`
- `package-lock.json`
- `dist/`
- `build/`
- `coverage/`
- `.next/`
- `.cache/`
- `test-results/`
- `playwright-report/`
- `blob-report/`
- `vitest-result.txt`
- `vitest-full-output.txt`
- `**/*vitest*.txt`
- `**/vitest.txt`
- `*.log`
- Folders not listed in Selector sources or Read order, including `docs/`, `scripts/`, `public/`, `.agents/`, and broad `src/` subtrees beyond the exact files above
- Whole-repo grep or reading every file under `src/`
