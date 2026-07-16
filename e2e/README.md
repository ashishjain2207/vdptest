# Playwright E2E (`e2e/`)

## Overview

This repository’s Playwright automation lives under `e2e/` and is executed with TypeScript specs and page objects.
The suite targets authenticated and guest journeys defined in `E2E_SCOPE.md`, with strict selector usage from scoped `src/` files only.

### Prerequisites

- Node.js 20+
- Dependencies installed from repository root (`npm ci`)
- Playwright browsers installed (`npx playwright install --with-deps`)

## Steps before CI/CD

1. Clone the repository and install dependencies from repo root:
   - `npm ci`
2. Export local environment variables (or load from local `.env`) using the **Local environment variables** table below.
3. Run Playwright locally before first CI run:
   - `npx playwright test -c e2e/playwright.config.ts`
4. In **GitHub → Settings → Secrets and variables → Actions**, add every required secret/variable from the tables below.
5. Only then run or rely on `.github/workflows/playwright-e2e.yml` (manual `workflow_dispatch` first is recommended).

## How to run locally

From repository root:

```bash
npm ci
npx playwright install --with-deps
npm run test:e2e:local
```

Local env file:

- Playwright now loads repo-root `.env.e2e.local` automatically via `e2e/playwright.config.ts`.
- Fill in `.env.e2e.local` with your local values before running.
- `npm run test:e2e:local` also generates:
  - `test-results/results.json`
  - `test-results/scenario-report.json`
  - `test-results/scenario-report.md`
  - `playwright-report/`
  - `testresults-run/testrun/local-.../` (GitHub-like staged output)

Run a single spec:

```bash
npm run test:e2e:local -- e2e/tests/authentication.spec.ts
```

## GitHub Actions secrets

| Secret name | Required | Used for | Example value (placeholder only) |
|---|---|---|---|
| `PLAYWRIGHT_BASE_URL` | Yes | Base URL for Playwright runs | `https://staging.example.test` |
| `E2E_USER_EMAIL` | Yes | Default authenticated user | `user@example.test` |
| `E2E_USER_PASSWORD` | Yes | Default authenticated user password | `replace-with-password` |
| `E2E_ADMIN_EMAIL` | No | Admin-only scenarios (tests skip when unset) | `admin@example.test` |
| `E2E_ADMIN_PASSWORD` | No | Admin-only scenarios (tests skip when unset) | `replace-with-admin-password` |
| `E2E_MODERATOR_EMAIL` | No | Moderator-only scenarios (tests skip when unset) | `moderator@example.test` |
| `E2E_MODERATOR_PASSWORD` | No | Moderator-only scenarios (tests skip when unset) | `replace-with-moderator-password` |
| `E2E_RESULTS_WEBHOOK_URL` | No | IMRIVA webhook endpoint for published result metadata | `https://imriva.example.test/e2e_test_analysis` |
| `E2E_RESULTS_WEBHOOK_TOKEN` | No | Bearer token for webhook authorization | `replace-with-webhook-token` |
| `NODE_AUTH_TOKEN` | No | Required only when private npm/GitHub packages are needed | `ghp_xxxxxxxxxxxxx` |

## GitHub Actions variables

| Variable | Required | Used for | Example (placeholder only) |
|---|---|---|---|
| `CLICKUP_TASK_ID` | Yes | Included in webhook payload for IMRIVA analysis | `869e1b3r8` |
| `E2E_SCENARIO_VERSION` | No | Default suffix for high-priority failure screenshots | `v1` |

## Local environment variables

| Variable | Required | Description | Example (placeholder only) |
|---|---|---|---|
| `PLAYWRIGHT_BASE_URL` | Yes | Base URL for local E2E execution | `https://staging.example.test` |
| `E2E_USER_EMAIL` | Yes | Default test-user email for login flows | `user@example.test` |
| `E2E_USER_PASSWORD` | Yes | Default test-user password | `replace-with-password` |
| `E2E_ADMIN_EMAIL` | No | Admin-user email for admin scenarios | `admin@example.test` |
| `E2E_ADMIN_PASSWORD` | No | Admin-user password for admin scenarios | `replace-with-admin-password` |
| `E2E_MODERATOR_EMAIL` | No | Moderator-user email for moderator scenarios | `moderator@example.test` |
| `E2E_MODERATOR_PASSWORD` | No | Moderator-user password for moderator scenarios | `replace-with-moderator-password` |
| `E2E_LANGUAGE` | No | UI language forced at browser startup for Playwright | `EN` |
| `E2E_WORKERS` | No | Number of Playwright workers to use | `1` |
| `E2E_SCENARIO_VERSION` | No | Screenshot suffix for `@high` failure screenshots | `v1` |

## CI results layout

- Workflow publishes results to branch `testresults`.
- Per-run path: `testrun/{run_number}/`
- Published run data includes `metadata.json`, `test-results/results.json`, scenario summaries, and `playwright-report/` when Playwright completes report generation.
- Report outputs are written at the repository root under `test-results/` and `playwright-report/`.
- Manual execution: **Actions → Playwright E2E** and choose:
  - `environment`
  - `git_ref`
  - `scenario_version`

Never commit real credentials or secret values; use placeholders only.
