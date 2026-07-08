# vdpconnect Playwright E2E Suite

## Overview

This directory contains the Playwright TypeScript E2E suite for the approved vdpconnect scenarios. All automation assets live under `e2e/`, including tests, page objects, fixtures, test data, utilities, and Playwright config.

Run locally from the repository root:

```bash
npm install
npx playwright install
npx playwright test -c e2e/playwright.config.ts
```

Run a single spec:

```bash
npx playwright test -c e2e/playwright.config.ts e2e/tests/login.spec.ts
```

## GitHub Actions secrets

Configure these as repository or organization secrets. Values below are placeholders only.

| Secret name | Required | Used for | Example value (placeholder only) |
|-------------|----------|----------|----------------------------------|
| `PLAYWRIGHT_BASE_URL` | yes | Base URL for the app under test | `https://staging.example.com` |
| `E2E_NORMAL_USER_EMAIL` | yes | Normal-user login scenarios and authenticated user journeys | `normal.user@example.com` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Normal-user login scenarios and authenticated user journeys | `normal-user-password-placeholder` |
| `E2E_NORMAL_USER_USERNAME` | no | Own-profile navigation fallback | `normaluser` |
| `E2E_NORMAL_USER_ID` | no | Own-profile navigation fallback | `00000000-0000-0000-0000-000000000001` |
| `E2E_NORMAL_USER_PROFILE_SLUG` | no | Own-profile navigation fallback | `normaluser-00000001` |
| `E2E_ADMIN_USER_EMAIL` | yes | Admin moderation and user-management scenarios | `admin.user@example.com` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin moderation and user-management scenarios | `admin-user-password-placeholder` |
| `E2E_ADMIN_USER_USERNAME` | no | Admin role metadata | `adminuser` |
| `E2E_ADMIN_USER_ID` | no | Admin role metadata | `00000000-0000-0000-0000-000000000002` |
| `E2E_ADMIN_USER_PROFILE_SLUG` | no | Admin role metadata | `adminuser-00000002` |
| `E2E_TARGET_USER_PROFILE_SLUG` | yes for permission/follow scenarios | Another user's profile for edit/delete/follow permission checks | `targetuser-00000003` |
| `E2E_TARGET_USER_USERNAME` | no | Another user's profile fallback | `targetuser` |
| `E2E_TARGET_USER_ID` | no | Another user's profile fallback | `00000000-0000-0000-0000-000000000003` |
| `E2E_DUPLICATE_USERNAME` | yes for duplicate registration | Seeded username that already exists | `testuser` |
| `E2E_COMMENT_TARGET_POST_ID` | yes for comments | Existing post detail page for comment scenarios | `00000000-0000-0000-0000-000000000004` |
| `E2E_OTHER_USER_POST_TEXT` | yes for post permission checks | Visible text on another user's seeded post | `Seeded visible post owned by another user` |
| `E2E_OTHER_USER_COMMENT_TEXT` | yes for comment permission checks | Visible text on another user's seeded comment | `Seeded comment owned by another user` |
| `E2E_REPORTED_POST_PREVIEW` | yes for admin moderation | Text preview for a seeded reported post/case | `Seeded reported post preview` |
| `E2E_REPORTED_POST_CASE_ID` | no | Optional cleanup/reset for reported-post moderation state | `00000000-0000-0000-0000-000000000005` |
| `E2E_ADMIN_TARGET_USER_EMAIL` | yes for admin user status | User account searchable by admin for suspend/reactivate | `target.user@example.com` |
| `E2E_API_BASE_URL` | no | Optional API cleanup helpers | `https://api.staging.example.com` |
| `E2E_API_TOKEN` | no | Optional bearer token for cleanup helpers if API cleanup is enabled | `api-token-placeholder` |
| `NODE_AUTH_TOKEN` | yes if CI installs private GitHub Packages | Package registry token for `@imriva/framework` install | `github-packages-token-placeholder` |

## Local environment variables

Create a gitignored `.env.e2e` file at the repository root with matching keys.

| Variable | Required | Description | Example (placeholder only) |
|----------|----------|-------------|----------------------------|
| `PLAYWRIGHT_BASE_URL` or `E2E_BASE_URL` | yes | Base URL used by Playwright config | `https://staging.example.com` |
| `E2E_NORMAL_USER_EMAIL` | yes | Normal user email/login identifier | `normal.user@example.com` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Normal user password | `normal-user-password-placeholder` |
| `E2E_ADMIN_USER_EMAIL` | yes | Admin user email/login identifier | `admin.user@example.com` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin user password | `admin-user-password-placeholder` |
| `E2E_TARGET_USER_PROFILE_SLUG` | yes for permission/follow specs | Public profile key for another user | `targetuser-00000003` |
| `E2E_DUPLICATE_USERNAME` | yes for registration negative spec | Existing username | `testuser` |
| `E2E_COMMENT_TARGET_POST_ID` | yes for comments specs | Existing post ID for comment coverage | `00000000-0000-0000-0000-000000000004` |
| `E2E_OTHER_USER_POST_TEXT` | yes for post permission specs | Seeded text on another user's post | `Seeded visible post owned by another user` |
| `E2E_OTHER_USER_COMMENT_TEXT` | yes for comment permission spec | Seeded text on another user's comment | `Seeded comment owned by another user` |
| `E2E_REPORTED_POST_PREVIEW` | yes for admin moderation spec | Seeded moderation queue text | `Seeded reported post preview` |
| `E2E_ADMIN_TARGET_USER_EMAIL` | yes for admin user spec | Admin-searchable target user | `target.user@example.com` |
| `E2E_REUSE_STORAGE_STATE` | no | Opt-in flag for role storage state reuse when implemented by CI | `false` |
| `PLAYWRIGHT_SKIP_WEB_SERVER` | no | Set to `true` when targeting an already-running environment | `true` |
| `NODE_AUTH_TOKEN` | yes if installing private packages locally | Token for GitHub Packages dependency install | `github-packages-token-placeholder` |

## CI vs local notes

- CI secrets map directly to the local variable names above.
- Never commit real credentials or tokens. Use `.env.e2e` locally and GitHub Actions secrets in CI.
- No `.env.example` is included in this task; use the tables above as the source for placeholder keys.
- `PLAYWRIGHT_BASE_URL` takes precedence over `E2E_BASE_URL`.
- Set `PLAYWRIGHT_SKIP_WEB_SERVER=true` in CI when `PLAYWRIGHT_BASE_URL` points to a deployed staging environment.

## Troubleshooting

- Missing or misspelled role credentials fail fast with `Missing required E2E environment variable`.
- If `npm install` fails for `@imriva/framework`, configure `NODE_AUTH_TOKEN` with access to GitHub Packages.
- If permission tests cannot find another user's post/comment, verify the seeded text variables match visible UI text exactly.
- If admin tests cannot find the moderation case or user row, confirm the seeded report/user exists in the target environment before running the suite.
- If Playwright starts a local Vite server unexpectedly, set `PLAYWRIGHT_SKIP_WEB_SERVER=true` when testing a remote staging URL.
