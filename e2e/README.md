# vdpconnect Playwright E2E suite

## Overview

This directory contains the Playwright TypeScript E2E suite for the approved vdpconnect user journeys. All automation lives under `e2e/`:

- `e2e/tests/` for `.spec.ts` files
- `e2e/pages/` for page objects
- `e2e/fixtures/` for Playwright fixtures and role-based auth helpers
- `e2e/test-data/` for scenario data and upload fixtures
- `e2e/utils/` for environment, seed, cleanup, and data helpers

Run locally from the repository root:

```bash
npm install
npx playwright install
npm run e2e
```

Useful alternatives:

```bash
npm run e2e:headed
npm run e2e:ui
npx playwright test -c e2e/playwright.config.ts e2e/tests/login.spec.ts
```

## GitHub Actions secrets

Configure these secrets at the repository or organization level before running the suite in CI.

| Secret name | Required | Used for | Example value (placeholder only) |
|-------------|----------|----------|----------------------------------|
| `E2E_BASE_URL` | yes | Base URL for the deployed environment under test | `https://staging.example.com` |
| `E2E_NORMAL_USER_EMAIL` | yes, unless `E2E_NORMAL_USER_USERNAME` is used | Normal user login scenarios | `normal-user@example.com` |
| `E2E_NORMAL_USER_USERNAME` | no | Normal user login when username login is preferred | `normaluser` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Normal user password for authenticated journeys | `normal-user-password-placeholder` |
| `E2E_NORMAL_USER_ID` | yes | Own profile navigation and self-follow prevention | `00000000-0000-0000-0000-000000000001` |
| `E2E_ADMIN_USER_EMAIL` | yes, unless `E2E_ADMIN_USER_USERNAME` is used | Admin panel login scenarios | `admin@example.com` |
| `E2E_ADMIN_USER_USERNAME` | no | Admin login when username login is preferred | `adminuser` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin user password for moderation scenarios | `admin-password-placeholder` |
| `E2E_TARGET_USER_ID` | no | Public target profile for follow/unfollow and permission scenarios | `00000000-0000-0000-0000-000000000002` |
| `E2E_TARGET_USERNAME` | yes for follow/permission scenarios without seed API | Public target username for follow/unfollow and other-user post scenarios | `public-target-user` |
| `E2E_DUPLICATE_USERNAME` | yes for duplicate registration validation | Existing username that registration must reject | `testuser` |
| `E2E_OWN_POST_ID` | no | Seeded own post detail navigation when needed | `post-own-placeholder` |
| `E2E_OWN_POST_TEXT` | yes for edit/delete own-post scenarios without seed API | Text of seeded post owned by the normal user | `Seeded post for Playwright edit scenario` |
| `E2E_OTHER_POST_ID` | no | Seeded other-user post detail navigation when needed | `post-other-placeholder` |
| `E2E_OTHER_POST_TEXT` | yes for other-user edit/delete permission scenarios without seed API | Text of a visible post owned by another user | `Seeded other-user post` |
| `E2E_COMMENT_POST_ID` | yes for comment scenarios without seed API | Existing post ID that allows comments | `comment-post-placeholder` |
| `E2E_OWN_COMMENT_TEXT` | yes for own-comment deletion without seed API | Text of a comment owned by the normal user | `Seeded Playwright comment for deletion` |
| `E2E_OTHER_COMMENT_TEXT` | yes for other-user comment permission checks without seed API | Text of a comment owned by another user | `Seeded other-user comment` |
| `E2E_REPORTED_POST_TEXT` | yes for admin reported-post removal without seed API | Text of a reported post visible in admin moderation | `Seeded reported post` |
| `E2E_MODERATION_USERNAME` | yes for admin account status without seed API | Username of account to suspend/reactivate | `seeded-moderation-target` |
| `E2E_API_BASE_URL` | no | Optional backend seed/cleanup API base URL | `https://staging-api.example.com` |
| `E2E_API_TOKEN` | no | Optional API token for seed/cleanup helpers | `e2e-api-token-placeholder` |
| `NODE_AUTH_TOKEN` | yes when CI installs private packages | Package registry token for private `@imriva/*` dependencies | `github-packages-token-placeholder` |

The suite also accepts the existing aliases `PLAYWRIGHT_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_USERNAME`, `E2E_USER_PASSWORD`, `E2E_USER_ID`, `E2E_PLATFORM_ADMIN_EMAIL`, `E2E_PLATFORM_ADMIN_USERNAME`, `E2E_PLATFORM_ADMIN_PASSWORD`, and `E2E_PLATFORM_ADMIN_ID`.

## Local environment variables

Create a gitignored `.env.e2e`, `.env.local`, or `.env` file at the repository root. The root `.env.example` already documents related application variables; keep real credentials out of source control.

| Variable | Required | Description | Example (placeholder only) |
|----------|----------|-------------|----------------------------|
| `E2E_BASE_URL` | yes | App URL under test | `http://localhost:5173` |
| `E2E_NORMAL_USER_EMAIL` | yes, unless username is used | Normal user email | `normal-user@example.com` |
| `E2E_NORMAL_USER_USERNAME` | no | Normal user username | `normaluser` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Normal user password | `normal-user-password-placeholder` |
| `E2E_NORMAL_USER_ID` | yes | Normal user profile ID for own-profile scenarios | `00000000-0000-0000-0000-000000000001` |
| `E2E_ADMIN_USER_EMAIL` | yes, unless username is used | Admin user email | `admin@example.com` |
| `E2E_ADMIN_USER_USERNAME` | no | Admin username | `adminuser` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin password | `admin-password-placeholder` |
| `E2E_DUPLICATE_USERNAME` | yes for registration validation | Username that already exists | `testuser` |
| `E2E_TARGET_USER_ID` | no | Target public profile ID | `00000000-0000-0000-0000-000000000002` |
| `E2E_TARGET_USERNAME` | yes for follow/permission scenarios without seed API | Target public username | `public-target-user` |
| `E2E_OWN_POST_TEXT` | yes for own-post edit/delete without seed API | Seeded own post text | `Seeded post for Playwright edit scenario` |
| `E2E_OTHER_POST_TEXT` | yes for other-user post permissions without seed API | Seeded other-user post text | `Seeded other-user post` |
| `E2E_COMMENT_POST_ID` | yes for comment scenarios without seed API | Post ID used by comment scenarios | `comment-post-placeholder` |
| `E2E_OWN_COMMENT_TEXT` | yes for own-comment deletion without seed API | Seeded own comment text | `Seeded Playwright comment for deletion` |
| `E2E_OTHER_COMMENT_TEXT` | yes for other-user comment permission without seed API | Seeded other-user comment text | `Seeded other-user comment` |
| `E2E_REPORTED_POST_TEXT` | yes for reported-post moderation without seed API | Seeded reported post text | `Seeded reported post` |
| `E2E_MODERATION_USERNAME` | yes for account status without seed API | User account to suspend/reactivate | `seeded-moderation-target` |
| `E2E_API_BASE_URL` | no | Optional seed/cleanup API URL | `http://localhost:5225` |
| `E2E_API_TOKEN` | no | Optional seed/cleanup API token | `local-e2e-api-token-placeholder` |
| `NODE_AUTH_TOKEN` | yes when installing private packages | Token used by npm for private `@imriva/*` packages | `github-packages-token-placeholder` |

## CI vs local notes

- Local variable names map directly to the same GitHub Actions secret names.
- Never commit real secrets or real user passwords; use placeholders in documentation.
- Use the root `.env.example` as the starting point for local environment setup.
- If `E2E_API_BASE_URL` and `E2E_API_TOKEN` are configured, seed helpers attempt backend precondition setup. Otherwise, the scenarios use the seeded IDs/text supplied through environment variables.
- Playwright stores transient authenticated storage snapshots under `e2e/.auth/`; do not commit that directory.

## Troubleshooting

- Missing `E2E_BASE_URL` or a bad URL causes navigation failures before assertions run.
- Missing normal/admin credentials fails role fixtures with a message listing accepted env key aliases.
- Missing seeded values such as `E2E_COMMENT_POST_ID`, `E2E_TARGET_USERNAME`, or `E2E_MODERATION_USERNAME` fails only the scenarios that require those preconditions.
- If `npm install` fails with `401 Unauthorized` for `@imriva/*`, configure `NODE_AUTH_TOKEN` for the private package registry before installing.
- If an upload validation scenario cannot find a file, confirm `e2e/test-data/uploads/` exists and was not removed by cleanup tooling.
