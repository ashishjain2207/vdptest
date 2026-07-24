# E2E Playwright package

This directory contains a standalone Playwright package for high-priority E2E coverage.

## Implemented scenario

- `@high` User can publish a text post from the feed composer.

## Prerequisites

- Application is running and reachable at `E2E_BASE_URL`.
- A normal user account exists for login.

## Environment variables

Set these before running tests:

- `E2E_BASE_URL` (example: `http://127.0.0.1:4173`)
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

Example placeholders:

```bash
export E2E_BASE_URL="http://127.0.0.1:4173"
export E2E_USER_EMAIL="your-test-user@example.com"
export E2E_USER_PASSWORD="your-test-password"
```

## Local run

```bash
cd e2e
npm ci
npx playwright install chromium
npm test -- --grep @high
```
