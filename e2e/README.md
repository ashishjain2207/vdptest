# Playwright E2E Suite

## Overview

This folder contains a TypeScript Playwright end-to-end suite for the Vite React app routes under:

- `/login`
- `/signup`
- `/posts`
- `/posts/:postId`
- `/profile/:userId`
- `/settings/profile`
- `/onboarding`
- `/admin/content-moderation`
- `/admin/users`

The suite keeps all automation inside `e2e/`, uses page objects plus shared fixtures, and prefers stable `data-testid` selectors. API-based setup helpers are included for pragmatic seeding and cleanup of posts, comments, follows, and auth storage state.

## GitHub Actions secrets

Use GitHub Actions secrets for values that contain credentials or environment-specific endpoints.

| Secret | Required | Purpose |
| --- | --- | --- |
| `E2E_BASE_URL` | Yes | Public app URL used by Playwright. |
| `E2E_API_BASE_URL` | Usually | Direct API base for seed/cleanup helpers; defaults to `E2E_BASE_URL`. |
| `E2E_OAUTH_TOKEN_URL` | Usually | Password-grant token endpoint for reusable auth setup. |
| `E2E_OAUTH_USERINFO_URL` | Optional | Userinfo endpoint; defaults from the token URL. |
| `E2E_OAUTH_CLIENT_ID` | Usually | OAuth client ID for password-grant auth. |
| `E2E_OAUTH_CLIENT_SECRET` | Optional | OAuth client secret when the environment requires it. |
| `E2E_OAUTH_SCOPE` | Optional | OAuth scope override; defaults to `openid profile api market`. |
| `E2E_USER_USERNAME` | Yes | Primary non-admin login identifier. |
| `E2E_USER_PASSWORD` | Yes | Primary non-admin password. |
| `E2E_ADMIN_USERNAME` | For admin specs | Platform admin login identifier. |
| `E2E_ADMIN_PASSWORD` | For admin specs | Platform admin password. |
| `E2E_SECONDARY_USER_USERNAME` | For social specs | Secondary user login identifier used for seeded posts/comments/follow targets. |
| `E2E_SECONDARY_USER_PASSWORD` | For social specs | Secondary user password. |
| `E2E_SECONDARY_USER_HANDLE` | Recommended | Route handle for the secondary account. |
| `E2E_ONBOARDING_USER_USERNAME` | For onboarding spec | Dedicated user that should still require home-country onboarding. |
| `E2E_ONBOARDING_USER_PASSWORD` | For onboarding spec | Password for the onboarding-only account. |
| `E2E_REGISTRATION_EMAIL_DOMAIN` | For registration submit spec | Disposable/test mailbox domain for unique signup addresses. |
| `E2E_REGISTRATION_PASSWORD` | Optional | Password used by registration data generation. |
| `E2E_ADMIN_SUSPEND_TARGET_USER_ID` | Optional | Dedicated admin suspension target if you later enable destructive suspend coverage. |
| `E2E_ADMIN_SUSPEND_TARGET_HANDLE` | Optional | Handle fallback for the same admin suspension target. |

## Local environment variables

These variables are read directly by the suite. Values shown here are placeholders only.

| Variable | Default | Notes |
| --- | --- | --- |
| `E2E_BASE_URL` | `http://127.0.0.1:4173` | App URL used by browser navigation. |
| `E2E_API_BASE_URL` | `E2E_BASE_URL` | Useful when the app is proxied but the seed helpers should hit the backend directly. |
| `E2E_OAUTH_TOKEN_URL` | `${E2E_BASE_URL}/m/oauth2/token` | Password grant token URL. |
| `E2E_OAUTH_USERINFO_URL` | Derived from token URL | Optional override for `/connect/userinfo`. |
| `E2E_OAUTH_CLIENT_ID` | `imriva-frontend` | Password grant client ID. |
| `E2E_OAUTH_CLIENT_SECRET` | empty | Only set when required by the identity server. |
| `E2E_OAUTH_SCOPE` | `openid profile api market` | Scope for password-grant login helpers. |
| `E2E_HOME_COUNTRY` | `DE` | ISO alpha-2 country used for signup/onboarding/profile helpers. |
| `E2E_USER_USERNAME` / `E2E_USER_PASSWORD` | empty | Primary member used by login, post, profile, and access-control specs. |
| `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD` | empty | Platform admin used by admin specs. |
| `E2E_SECONDARY_USER_USERNAME` / `E2E_SECONDARY_USER_PASSWORD` | empty | Secondary account used to seed another user's posts/comments. |
| `E2E_SECONDARY_USER_HANDLE` | empty | Route handle for the secondary account. |
| `E2E_TARGET_USER_HANDLE` | `E2E_SECONDARY_USER_HANDLE` | General profile/follow target when the suite needs "another user". |
| `E2E_ONBOARDING_USER_USERNAME` / `E2E_ONBOARDING_USER_PASSWORD` | empty | Dedicated account that should redirect to `/onboarding`. |
| `E2E_REGISTRATION_EMAIL_DOMAIN` | `example.test` | Override in real environments so successful signup can use a valid disposable mailbox domain. |
| `E2E_REGISTRATION_PASSWORD` | `ChangeMe123!` | Password used by the successful registration scenario. |
| `E2E_ADMIN_SUSPEND_TARGET_USER_ID` | empty | Optional dedicated user for future destructive admin suspend coverage. |
| `E2E_ADMIN_SUSPEND_TARGET_HANDLE` | `E2E_SECONDARY_USER_HANDLE` | Optional fallback handle for the same purpose. |
| `E2E_WEB_SERVER_COMMAND` | empty | Optional local-only command such as `npm run dev -- --host 127.0.0.1 --port 4173`. |

## CI vs local notes

- Local runs can reuse an already-running app by omitting `E2E_WEB_SERVER_COMMAND`.
- CI can start the app automatically by setting `E2E_WEB_SERVER_COMMAND`.
- The suite intentionally skips env-dependent scenarios when the required credentials are not configured instead of failing on import.
- The primary user should already have a home country set for the core post/profile/admin flows. Use the dedicated onboarding account for `/onboarding` coverage.
- Registration and onboarding remain environment-sensitive because they depend on identity, profile provisioning, and mailbox/home-country state outside the frontend itself.

## Troubleshooting

- **Redirected back to `/login` immediately**  
  Verify the password-grant values (`E2E_OAUTH_*`) and that the credentials belong to real accounts in the target environment.

- **Seed helpers fail but browser navigation works**  
  Set `E2E_API_BASE_URL` and `E2E_OAUTH_TOKEN_URL` explicitly instead of relying on frontend proxy behavior.

- **Onboarding spec never reaches `/onboarding`**  
  The onboarding account already has a home country, or the environment bypasses onboarding for that role.

- **Follow/comment/admin specs skip unexpectedly**  
  Check the secondary/admin/onboarding env vars; those tests deliberately self-skip when the required account set is incomplete.

- **Role, moderation, or upload behavior differs across environments**  
  The suite keeps destructive or non-deterministic flows minimal. If your backend has stricter moderation, email verification, or media rules, provide dedicated test users and stable fixtures for those scenarios.
