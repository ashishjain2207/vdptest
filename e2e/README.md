# Playwright E2E suite

## Overview

This repository keeps all Playwright automation under `e2e/`:

- `e2e/tests/` for `.spec.ts` files
- `e2e/pages/` for page objects
- `e2e/fixtures/` for shared test fixtures and auth state helpers
- `e2e/test-data/` for JSON scenario data and upload fixtures
- `e2e/utils/` for environment loading, data factories, seeding, and cleanup

Run the suite from the repository root:

```sh
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```

Or call Playwright directly:

```sh
npx playwright test -c e2e/playwright.config.ts
```

Create a gitignored `.env.e2e` or `.env.e2e.local` file at the repo root before running the suite locally.

## GitHub Actions secrets

Configure these secrets in the repository or organization settings:

| Secret name | Required | Used for | Example value (placeholder only) |
|-------------|----------|----------|----------------------------------|
| `E2E_BASE_URL` | yes | Browser base URL for the frontend under test | `https://staging.app.example.com` |
| `E2E_API_BASE_URL` | yes | Direct API seeding and cleanup calls | `https://staging.api.example.com` |
| `E2E_IDENTITY_BASE_URL` | yes | Password-grant login and userinfo calls | `https://staging.auth.example.com` |
| `E2E_OIDC_CLIENT_ID` | no | Overrides the default OIDC client id used by the helpers | `imriva-frontend` |
| `E2E_NORMAL_USER_EMAIL` | yes | Primary non-admin user login for authenticated scenarios | `normal.user@example.com` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Primary non-admin user password | `Password123!` |
| `E2E_NORMAL_USER_HANDLE` | yes | Primary non-admin profile navigation target | `normal-user` |
| `E2E_ADMIN_USER_EMAIL` | yes | Admin login for moderation and user-management scenarios | `admin.user@example.com` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin password | `Password123!` |
| `E2E_ADMIN_USER_HANDLE` | no | Admin profile handle if you want profile-based assertions later | `admin-user` |
| `E2E_SECONDARY_USER_EMAIL` | yes | Secondary user for other-user permission and follow scenarios | `secondary.user@example.com` |
| `E2E_SECONDARY_USER_PASSWORD` | yes | Secondary user password | `Password123!` |
| `E2E_SECONDARY_USER_HANDLE` | yes | Secondary user profile handle for navigation and assertions | `secondary-user` |
| `E2E_EXISTING_USERNAME` | no | Username used by duplicate-registration coverage | `testuser` |
| `E2E_DEFAULT_HOME_COUNTRY` | no | Default `X-Country-Code` used by API seed helpers | `US` |
| `E2E_REPORT_REASON` | no | Default moderation report reason for admin queue seeding | `Automated moderation seed` |
| `NODE_AUTH_TOKEN` | no | Needed only when CI must install private `@imriva/*` packages from GitHub Packages | `ghp_placeholder_only` |

## Local environment variables

Use the same keys in a local `.env.e2e` or `.env.e2e.local` file:

| Variable | Required | Description | Example (placeholder only) |
|----------|----------|-------------|----------------------------|
| `E2E_BASE_URL` | yes | Frontend URL used by Playwright `baseURL` | `http://127.0.0.1:4173` |
| `E2E_API_BASE_URL` | yes | API origin used by `e2e/utils/seed.ts` | `http://127.0.0.1:5225` |
| `E2E_IDENTITY_BASE_URL` | yes | Identity server origin used for password grant login | `https://localhost:5001` |
| `E2E_OIDC_CLIENT_ID` | no | Client id for direct token requests | `imriva-frontend` |
| `E2E_NORMAL_USER_EMAIL` | yes | Main user email for login and author-owned flows | `normal.user@example.com` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Main user password | `Password123!` |
| `E2E_NORMAL_USER_HANDLE` | yes | Main user handle for profile navigation | `normal-user` |
| `E2E_ADMIN_USER_EMAIL` | yes | Admin email for `/admin/*` scenarios | `admin.user@example.com` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin password | `Password123!` |
| `E2E_ADMIN_USER_HANDLE` | no | Admin handle for optional profile coverage | `admin-user` |
| `E2E_SECONDARY_USER_EMAIL` | yes | Other-user account used for permission checks and seeded posts | `secondary.user@example.com` |
| `E2E_SECONDARY_USER_PASSWORD` | yes | Other-user account password | `Password123!` |
| `E2E_SECONDARY_USER_HANDLE` | yes | Other-user profile handle | `secondary-user` |
| `E2E_EXISTING_USERNAME` | no | Duplicate-registration target username | `testuser` |
| `E2E_DEFAULT_HOME_COUNTRY` | no | Default country code for seeded API requests | `US` |
| `E2E_REPORT_REASON` | no | Default moderation report reason | `Automated moderation seed` |
| `E2E_START_COMMAND` | no | Optional local command for Playwright `webServer` mode | `npm run dev -- --host 127.0.0.1 --port 4173` |
| `NODE_AUTH_TOKEN` | no | Private package install token when you need a full local `npm install` | `ghp_placeholder_only` |

## CI vs local notes

- The Playwright config reads the same variable names in CI and locally.
- GitHub secrets can map 1:1 to the local env var names shown above.
- Never commit real credentials or tokens; use placeholders only in docs and examples.
- No `e2e/.env.example` file is committed right now, so use the tables above as the contract for your local `.env.e2e`.
- The repository uses a private `@imriva/framework` package. If your CI job performs a fresh `npm install`, configure `NODE_AUTH_TOKEN` for GitHub Packages access.

## Troubleshooting

- **`Missing required E2E environment variable`**: add the missing key to `.env.e2e(.local)` or the CI secret set.
- **Auth state never sticks / tests keep redirecting to `/login`**: verify `E2E_IDENTITY_BASE_URL`, `E2E_OIDC_CLIENT_ID`, and the role credentials.
- **API seeding fails with country or permission errors**: confirm the seeded users exist and `E2E_DEFAULT_HOME_COUNTRY` matches a supported market.
- **`npm install` fails for `@imriva/framework`**: configure `NODE_AUTH_TOKEN` for GitHub Packages before installing dependencies.
- **Onboarding upload scenario is skipped**: the current product UI only exposes the home-country onboarding step; there is no profile-picture upload step available yet.
