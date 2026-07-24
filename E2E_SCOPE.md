# E2E Scope

## Purpose
- App name: `vite_react_shadcn`
- Stack: Vite 5 + React 18 + React Router 6 + Redux Toolkit + TanStack Query + Tailwind + `@imriva/framework`
- IMRIVA should read this file first before opening `src/`.
- Scenarios come from ClickUp at GENERATE SCRIPTS; this file documents the repository only.
- The app is multi-language (`src/i18n/en.js`, `src/i18n/de.js`), so E2E should force English and prefer `data-testid` where available.

## E2E status today
- `e2e/` exists: **no**
- IMRIVA will scaffold `e2e/` on GENERATE SCRIPTS.
- Existing `playwright.config.ts`: not present
- Related root file already present: `.env.e2e.local`

## Read order
1. `E2E_SCOPE.md`
2. `.cursorignore`
3. `src/App.jsx`
4. `src/lib/appRoutes.js`
5. `src/pages/Login.jsx`
6. `src/pages/Signup.jsx`
7. `src/components/layout/Header.jsx`
8. `src/components/ui/ClearableSearchInput.jsx`
9. `src/components/layout/Sidebar.jsx`
10. `src/components/layout/MobileSidebar.jsx`
11. `src/pages/Index.jsx`
12. `src/components/post/CreatePost.jsx`
13. `src/components/settings/SettingsSidebar.jsx`
14. `package.json`

## Selector sources (read-only)
Do not modify files under `src/`.

| Path | Contains | Selector hints |
|------|----------|----------------|
| `src/pages/Login.jsx` | Public login form at `/login` | `id="email"`, `id="password"`, `role="status"` for the maintenance banner, `to="/forgot-password"`, `to="/signup"` |
| `src/pages/Signup.jsx` | Public registration form at `/signup` | `id="name"`, `id="username"`, `id="signup-home-country"`, `id="email"`, `id="password"`, `to="/login"`, `to="/terms"`, `to="/privacy"`, `to="/cookie"`, `to="/accessibility"` |
| `src/components/layout/Header.jsx` | Global authenticated header and top actions | `dataTestId="header-global-search"`, `aria-label={t('layout.open_navigation_menu')}`, `aria-label={t('layout.search_posts_and_people')}`, `clearAriaLabel={t('common.clearSearch')}`, `aria-label={t('feed.createPost')}` |
| `src/components/ui/ClearableSearchInput.jsx` | Stable search input wrapper used by the header | `data-testid={dataTestId}`, `data-testid={dataTestId ? \`${dataTestId}-root\` : undefined}`, `data-testid={dataTestId ? \`${dataTestId}-clear\` : undefined}`, `clearAriaLabel = 'Clear search'` |
| `src/components/layout/Sidebar.jsx` | Desktop navigation for authenticated users | `aria-label="VDPConnect home"`, `to="/posts"`, `to="/explore"`, `to="/people"`, `to="/partners"`, `to="/events"`, `to="/messages"`, `to="/notifications"`, `to="/bookmarks"`, `to="/settings"` |
| `src/components/layout/MobileSidebar.jsx` | Mobile navigation drawer | `aria-label="VDPConnect home"`, `aria-label="Close menu"`, `to="/posts"`, `to="/explore"`, `to="/people"`, `to="/partners"`, `to="/events"`, `to="/messages"`, `to="/notifications"`, `to="/bookmarks"`, `to="/settings"` |
| `src/components/post/CreatePost.jsx` | Feed composer used from the post feed and header modal | `aria-label={toastT('posts.post_content')}`, `aria-label={label('addImage')}`, `aria-label={label('addLink')}`, `aria-label={label('createPoll')}`, `aria-label={label('addLocation')}`, `aria-label="Remove option"`, `aria-label="Remove link"`, `aria-label="Remove location"` |
| `src/components/settings/SettingsSidebar.jsx` | Settings navigation | `to="/settings/profile"`, `to="/settings/account"` |

## Scenario coverage
No injected ClickUp P1/P2 scenario index was present in the provided approval prompt on July 24, 2026, so exact scenario-name mapping is intentionally left at `0/0` rather than guessed.

| Scenario | src/ path(s) | Selector hints |
|----------|-------------|----------------|
| Await injected P1/P2 scenario names from ClickUp | `src/pages/Login.jsx`, `src/pages/Signup.jsx`, `src/pages/Index.jsx`, `src/components/layout/Header.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/post/CreatePost.jsx` | `id="email"`, `id="password"`, `id="name"`, `data-testid="header-global-search"`, `aria-label="VDPConnect home"` |

## Routes / navigation
- Router file: `src/App.jsx`
- Public auth/legal/support routes seen in the router: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/callback`, `/verify-email`, `/terms`, `/privacy`, `/cookie`, `/accessibility`, `/support`, `/maintenance`
- Support/admin-access routes seen in the router: `/support/inbox`, `/support/content-moderation`, `/admin`, `/admin/partners`, `/admin/events`, `/admin/ads`, `/admin/users`, `/admin/feedback`, `/admin/content-moderation`, `/admin/settings`, `/admin/audit-logs`
- Core authenticated routes seen in the router: `/posts`, `/explore`, `/people`, `/profile/:userId`, `/organizations`, `/partners`, `/events`, `/event/:id`, `/messages`, `/messages/:conversationId`, `/notifications`, `/bookmarks`, `/settings`, `/settings/profile`, `/settings/account`, `/studio`
- Canonical path helpers live in `src/lib/appRoutes.js` for posts, post media, profiles, messages, partners, partner manage/invite, and the feed path `/posts`.

## Write scope (IMRIVA creates at GENERATE SCRIPTS - do not create now)
- `e2e/package.json` + `e2e/package-lock.json` - Playwright-only package (minimal `npm ci` in CI)
- `e2e/tests/`
- `e2e/pages/`
- `e2e/fixtures/`
- `e2e/test-data/`
- `e2e/utils/`
- `e2e/playwright.config.ts` - `workers: 1`, English locale when multi-language, longer timeouts
- `e2e/README.md` - secrets/variables + local setup steps before CI/CD (not in this PR)
- `.github/workflows/playwright-e2e.yml` - install/run from `e2e/` only

## Do not explore
- Paths listed in `.cursorignore`
- Folders not listed in Selector sources
- Whole-repo grep or reading every file under `src/`
