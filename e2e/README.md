# Feed Composer E2E (Playwright)

This package contains the approved feed-composer positive scenarios.

## Prerequisites

1. Install dependencies:
   - `cd e2e`
   - `npm install`
2. Ensure the application is running and reachable (default expected base URL is `http://127.0.0.1:5173`).

## Environment variables

- `E2E_BASE_URL` (optional): App base URL. Defaults to `http://127.0.0.1:5173`.
- `E2E_USER_EMAIL` (required): Authenticated normal-user email.
- `E2E_USER_PASSWORD` (required): Authenticated normal-user password.

## Run tests

- `npm test`
- `npm run test:headed`

## Notes

- Locale is forced to English.
- Workers are fixed to `1` and `fullyParallel` is disabled.
