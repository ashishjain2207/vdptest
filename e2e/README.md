# Playwright E2E Suite

## Overview

This repository keeps all Playwright automation inside `e2e/`:

- `e2e/tests/`
- `e2e/pages/`
- `e2e/fixtures/`
- `e2e/test-data/`
- `e2e/utils/`

The suite is written in TypeScript, uses page objects plus reusable auth fixtures, and prefers stable `data-testid` selectors wherever the current app exposes them.

Run locally from the repository root:

- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npx playwright test -c e2e/playwright.config.ts`

If you want Playwright to start the app for you locally or in CI, set `E2E_WEB_SERVER_COMMAND`.

## GitHub Actions secrets

Configure these repository or organization secrets for CI runs.

| Secret name | Required | Used for | Example value (placeholder only) |
|-------------|----------|----------|----------------------------------|
| `E2E_BASE_URL` | yes | Browser base URL for the environment under test | `https://staging.example.com` |
| `E2E_API_BASE_URL` | no | Direct backend URL for API seed and cleanup helpers when it differs from the browser base URL | `https://api.staging.example.com` |
| `E2E_OAUTH_TOKEN_URL` | yes | Password-grant token endpoint used to build reusable storage states and seed API data | `https://auth.staging.example.com/connect/token` |
| `E2E_OAUTH_USERINFO_URL` | no | Optional explicit userinfo endpoint for auth/profile resolution | `https://auth.staging.example.com/connect/userinfo` |
| `E2E_OAUTH_CLIENT_ID` | yes | OAuth client ID for password-grant auth | `imriva-frontend` |
| `E2E_OAUTH_CLIENT_SECRET` | no | OAuth client secret when the identity environment requires one | `placeholder-client-secret` |
| `E2E_OAUTH_SCOPE` | no | Scope override for seeded auth sessions | `openid profile api market` |
| `E2E_USER_USERNAME` | yes | Primary normal-user login for login, create post, edit/delete post, comments, profile, and follow specs | `member@example.com` |
| `E2E_USER_PASSWORD` | yes | Primary normal-user password | `placeholder-member-password` |
| `E2E_ADMIN_USERNAME` | yes for admin specs | Admin login for moderation and user-management scenarios | `platform-admin@example.com` |
| `E2E_ADMIN_PASSWORD` | yes for admin specs | Admin password | `placeholder-admin-password` |
| `E2E_SECONDARY_USER_USERNAME` | yes for social/permission specs | Secondary normal-user login used to seed visible posts/comments and follow targets | `secondary-member@example.com` |
| `E2E_SECONDARY_USER_PASSWORD` | yes for social/permission specs | Secondary normal-user password | `placeholder-secondary-password` |
| `E2E_SECONDARY_USER_HANDLE` | no | Secondary user profile handle when route lookups should not depend on API discovery | `secondary-member` |
| `E2E_TARGET_USER_HANDLE` | no | Optional explicit follow/profile target override | `public-target-user` |
| `E2E_ONBOARDING_USER_USERNAME` | yes for onboarding spec | Dedicated account expected to land on `/onboarding` | `new-member@example.com` |
| `E2E_ONBOARDING_USER_PASSWORD` | yes for onboarding spec | Dedicated onboarding account password | `placeholder-onboarding-password` |
| `E2E_REGISTRATION_EMAIL_DOMAIN` | yes for successful signup coverage | Domain used for generated unique registration addresses | `mail.test.example` |
| `E2E_REGISTRATION_PASSWORD` | no | Default password for generated signup users | `ChangeMe123!` |
| `E2E_HOME_COUNTRY` | no | ISO alpha-2 country used in signup/onboarding/profile flows | `DE` |
| `E2E_ADMIN_SUSPEND_TARGET_USER_ID` | no | Optional dedicated user id for destructive suspend/reactivate coverage | `00000000-0000-0000-0000-000000000000` |
| `E2E_ADMIN_SUSPEND_TARGET_HANDLE` | no | Optional dedicated handle fallback for the suspend/reactivate scenario | `suspend-target-user` |

## Local environment variables

Store local values in a gitignored `.env`, `.env.local`, or `.env.e2e` file.

| Variable | Required | Description | Example (placeholder only) |
|----------|----------|-------------|----------------------------|
| `E2E_BASE_URL` | yes | Frontend URL Playwright opens in the browser | `http://127.0.0.1:4173` |
| `E2E_API_BASE_URL` | no | Direct backend URL for API seeding/cleanup helpers | `http://127.0.0.1:5225` |
| `E2E_OAUTH_TOKEN_URL` | yes | Password-grant token endpoint | `https://localhost:5001/connect/token` |
| `E2E_OAUTH_USERINFO_URL` | no | Optional explicit userinfo endpoint | `https://localhost:5001/connect/userinfo` |
| `E2E_OAUTH_CLIENT_ID` | yes | OAuth client id used by seed/auth helpers | `imriva-frontend` |
| `E2E_OAUTH_CLIENT_SECRET` | no | OAuth client secret when required | `placeholder-client-secret` |
| `E2E_OAUTH_SCOPE` | no | OAuth scope override | `openid profile api market` |
| `E2E_USER_USERNAME` | yes | Primary normal-user login identifier | `member@example.com` |
| `E2E_USER_PASSWORD` | yes | Primary normal-user password | `placeholder-member-password` |
| `E2E_ADMIN_USERNAME` | yes for admin specs | Platform admin login identifier | `platform-admin@example.com` |
| `E2E_ADMIN_PASSWORD` | yes for admin specs | Platform admin password | `placeholder-admin-password` |
| `E2E_SECONDARY_USER_USERNAME` | yes for permission/follow/comment specs | Secondary user login identifier | `secondary-member@example.com` |
| `E2E_SECONDARY_USER_PASSWORD` | yes for permission/follow/comment specs | Secondary user password | `placeholder-secondary-password` |
| `E2E_SECONDARY_USER_HANDLE` | no | Secondary user profile handle | `secondary-member` |
| `E2E_TARGET_USER_HANDLE` | no | Optional dedicated follow/profile target handle | `public-target-user` |
| `E2E_ONBOARDING_USER_USERNAME` | yes for onboarding spec | Dedicated onboarding account login | `new-member@example.com` |
| `E2E_ONBOARDING_USER_PASSWORD` | yes for onboarding spec | Dedicated onboarding account password | `placeholder-onboarding-password` |
| `E2E_REGISTRATION_EMAIL_DOMAIN` | yes for successful registration coverage | Domain used for generated signup emails | `mail.test.example` |
| `E2E_REGISTRATION_PASSWORD` | no | Password used by generated registration users | `ChangeMe123!` |
| `E2E_HOME_COUNTRY` | no | Home country applied in signup/onboarding/profile flows | `DE` |
| `E2E_ADMIN_SUSPEND_TARGET_USER_ID` | no | Optional dedicated admin suspend target id | `00000000-0000-0000-0000-000000000000` |
| `E2E_ADMIN_SUSPEND_TARGET_HANDLE` | no | Optional dedicated admin suspend target handle | `suspend-target-user` |
| `E2E_WEB_SERVER_COMMAND` | no | Command Playwright should run before tests | `npm run dev -- --host 127.0.0.1 --port 4173` |

## CI vs local notes

- `E2E_BASE_URL`, `E2E_API_BASE_URL`, and the `E2E_OAUTH_*` keys typically map one-to-one between local env vars and GitHub secrets.
- The `E2E_USER_*`, `E2E_ADMIN_*`, `E2E_SECONDARY_USER_*`, and `E2E_ONBOARDING_USER_*` variable names are the same locally and in CI.
- Never commit real secrets or working credentials. Keep placeholder values only in documentation and JSON fixtures.
- This repo already contains a root `.env.example`; use that as the starting point for app/runtime variables and add the `E2E_*` values in your local gitignored env file.
- Some scenarios are intentionally self-skipping when the required role credentials or target handles are not configured, so CI should supply the full account set for complete coverage.

## Troubleshooting

- **Tests fail before navigation with missing-env errors**  
  Check the exact `E2E_*` variable names. A misnamed username/password pair is the most common cause.

- **Protected-route tests redirect back to `/login`**  
  Verify `E2E_OAUTH_TOKEN_URL`, `E2E_OAUTH_CLIENT_ID`, and the corresponding role credentials.

- **API seeding fails while browser navigation still works**  
  Set `E2E_API_BASE_URL` explicitly instead of relying on frontend proxy behavior.

- **Successful registration keeps skipping**  
  Replace the placeholder `E2E_REGISTRATION_EMAIL_DOMAIN=example.test` with a disposable or test-only domain accepted by the target identity environment.

- **Onboarding coverage never reaches `/onboarding`**  
  The onboarding account already has a saved home country, or the backend no longer routes that role through onboarding.

- **Admin or social permission scenarios skip unexpectedly**  
  Confirm that `E2E_ADMIN_*`, `E2E_SECONDARY_USER_*`, `E2E_TARGET_USER_HANDLE`, and optional suspend-target values are configured and point to real accounts.
