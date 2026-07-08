# Playwright E2E Suite

## Overview

This repository's Playwright TypeScript end-to-end automation lives entirely under `e2e/`.
The suite uses reusable page objects, role-based auth fixtures, JSON fixture data, and seed-driven
preconditions for the approved vdpconnect journeys.

Run the suite from the repository root with one of the following commands:

```bash
npm run e2e
npm run e2e:headed
npm run e2e:ui
npx playwright test -c e2e/playwright.config.ts
```

## GitHub Actions secrets

Configure the following repository or organization secrets before running the suite in CI.
All values below are placeholders only.

| Secret name | Required | Used for | Example value (placeholder only) |
|-------------|----------|----------|----------------------------------|
| `E2E_BASE_URL` | yes | Base URL for the environment under test | `https://staging.example.com` |
| `E2E_NORMAL_USER_EMAIL` | yes | Standard user login for authenticated post, comment, profile, follow, and access-control scenarios | `member@example.com` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Password for the standard user role | `ChangeMe123!` |
| `E2E_NORMAL_USER_USERNAME` | no | Stable username/handle when login uses username instead of email | `member-user` |
| `E2E_NORMAL_USER_USERNAME_OR_EMAIL` | no | Explicit login identifier override when it differs from the email secret | `member-user` |
| `E2E_NORMAL_USER_PROFILE_KEY` | no | Profile route key/handle for assertions that navigate back to the signed-in user's profile | `member-user` |
| `E2E_ADMIN_USER_EMAIL` | yes | Admin user login for moderation and admin-users scenarios | `admin@example.com` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Password for the admin role | `ChangeMe123!` |
| `E2E_ADMIN_USER_USERNAME` | no | Stable admin username/handle when email login is not preferred | `platform-admin` |
| `E2E_ADMIN_USER_USERNAME_OR_EMAIL` | no | Explicit admin login identifier override | `platform-admin` |
| `E2E_DUPLICATE_USERNAME` | no | Existing username used for the duplicate-registration negative scenario | `testuser` |
| `E2E_OTHER_USER_PROFILE_KEY` | no | Other user's public profile key used for edit/delete permission checks | `public-profile-handle` |
| `E2E_OTHER_USER_POST_TEXT` | no | Known post text for the other-user post targeted by edit/delete permission assertions | `Seeded other-user post` |
| `E2E_COMMENT_TARGET_POST_ID` | no | Existing post GUID containing another user's comment for comment-permission coverage | `00000000-0000-0000-0000-000000000000` |
| `E2E_OTHER_USER_COMMENT_TEXT` | no | Known other-user comment text for delete-permission checks | `Seeded comment text` |
| `E2E_FOLLOW_TARGET_PROFILE_KEY` | no | Public profile key used by the follow/unfollow scenario | `follow-target-user` |
| `E2E_FOLLOW_TARGET_DISPLAY_NAME` | no | Optional display-name hint for follow/unfollow debugging and trace readability | `Follow Target` |
| `E2E_REPORTED_CASE_ID` | no | Existing admin moderation case id when selecting a specific moderation item | `case-12345` |
| `E2E_REPORTED_CASE_PREVIEW` | no | Content preview text used to locate a moderation case when the case id is not supplied | `Reported content preview` |
| `E2E_ADMIN_TARGET_USER_QUERY` | no | Search term used on `/admin/users` for the suspend/reactivate scenario | `moderation-target@example.com` |
| `E2E_ADMIN_TARGET_USER_PROFILE_KEY` | no | Optional profile key for the admin-managed account | `moderation-target` |
| `E2E_ONBOARDING_USER_EMAIL` | no | Dedicated user email that still lands on `/onboarding` | `new-user@example.com` |
| `E2E_ONBOARDING_USER_PASSWORD` | no | Password for the onboarding-specific user | `ChangeMe123!` |
| `E2E_ONBOARDING_USER_USERNAME_OR_EMAIL` | no | Explicit onboarding-user login identifier override | `new-user@example.com` |

## Local environment variables

Store local values in a gitignored `.env.e2e` or `e2e/.env.e2e` file.

| Variable | Required | Description | Example (placeholder only) |
|----------|----------|-------------|----------------------------|
| `E2E_BASE_URL` | yes | Application base URL used by Playwright's `baseURL` setting | `http://127.0.0.1:4173` |
| `E2E_NORMAL_USER_EMAIL` | yes | Normal user email credential | `member@example.com` |
| `E2E_NORMAL_USER_PASSWORD` | yes | Normal user password credential | `ChangeMe123!` |
| `E2E_NORMAL_USER_USERNAME` | no | Normal user handle/profile username | `member-user` |
| `E2E_NORMAL_USER_USERNAME_OR_EMAIL` | no | Explicit login identifier for the normal user | `member-user` |
| `E2E_NORMAL_USER_PROFILE_KEY` | no | Profile route key used by profile assertions | `member-user` |
| `E2E_ADMIN_USER_EMAIL` | yes | Admin user email credential | `admin@example.com` |
| `E2E_ADMIN_USER_PASSWORD` | yes | Admin user password credential | `ChangeMe123!` |
| `E2E_ADMIN_USER_USERNAME` | no | Admin username/handle | `platform-admin` |
| `E2E_ADMIN_USER_USERNAME_OR_EMAIL` | no | Explicit login identifier for the admin role | `platform-admin` |
| `E2E_DUPLICATE_USERNAME` | no | Existing duplicate username seed | `testuser` |
| `E2E_OTHER_USER_PROFILE_KEY` | no | Public profile key used for other-user permission checks | `public-profile-handle` |
| `E2E_OTHER_USER_POST_TEXT` | no | Known text of the seeded post used for edit/delete permission checks | `Seeded other-user post` |
| `E2E_COMMENT_TARGET_POST_ID` | no | Existing post GUID containing another user's comment | `00000000-0000-0000-0000-000000000000` |
| `E2E_OTHER_USER_COMMENT_TEXT` | no | Known other-user comment text | `Seeded comment text` |
| `E2E_FOLLOW_TARGET_PROFILE_KEY` | no | Public profile key for follow/unfollow | `follow-target-user` |
| `E2E_FOLLOW_TARGET_DISPLAY_NAME` | no | Display name hint for traces/screenshots | `Follow Target` |
| `E2E_REPORTED_CASE_ID` | no | Specific moderation case id to resolve | `case-12345` |
| `E2E_REPORTED_CASE_PREVIEW` | no | Preview text fallback for moderation case lookup | `Reported content preview` |
| `E2E_ADMIN_TARGET_USER_QUERY` | no | `/admin/users` search input for suspend/reactivate coverage | `moderation-target@example.com` |
| `E2E_ADMIN_TARGET_USER_PROFILE_KEY` | no | Optional profile key for the admin-managed account | `moderation-target` |
| `E2E_ONBOARDING_USER_EMAIL` | no | Dedicated onboarding-user email | `new-user@example.com` |
| `E2E_ONBOARDING_USER_PASSWORD` | no | Dedicated onboarding-user password | `ChangeMe123!` |
| `E2E_ONBOARDING_USER_USERNAME_OR_EMAIL` | no | Explicit login identifier for the onboarding user | `new-user@example.com` |

## CI vs local notes

- CI secrets map 1:1 to the same environment-variable names consumed locally.
- `E2E_BASE_URL` is used directly by `e2e/playwright.config.ts`.
- The role secrets (`E2E_NORMAL_USER_*`, `E2E_ADMIN_USER_*`, and optional onboarding-user keys) are loaded by `e2e/utils/env.ts`.
- Never commit real secrets or seeded identifiers; keep placeholders only in this README.
- Create a local `.env.e2e` or `e2e/.env.e2e` file because no committed `.env.example` file is provided for this suite yet.

## Troubleshooting

- **`Missing required E2E environment variable`**: confirm the variable exists in GitHub Actions or your local `.env.e2e` file and that the name matches exactly.
- **Guest scenarios redirect unexpectedly**: verify `E2E_BASE_URL` points at the intended environment and that protected routes are accessible there.
- **Auth fixture keeps landing back on `/login`**: the normal-user or admin credentials are invalid, expired, or missing role access for the target environment.
- **Permission tests cannot find another user's content**: seed the optional `E2E_OTHER_USER_*`, `E2E_COMMENT_TARGET_POST_ID`, and `E2E_OTHER_USER_COMMENT_TEXT` variables with visible content in the target environment.
- **Admin moderation tests cannot locate a case**: set `E2E_REPORTED_CASE_ID` or `E2E_REPORTED_CASE_PREVIEW` to a live moderation item before running the suite.
- **Onboarding specs skip immediately**: the configured onboarding user already completed onboarding or the current app build no longer exposes the profile-picture onboarding step.
