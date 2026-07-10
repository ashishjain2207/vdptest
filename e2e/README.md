# Playwright E2E Suite

## Overview

This repository's end-to-end suite lives under `e2e/` and uses Playwright + TypeScript.

Run locally:

1. Export local environment variables from the table below.
2. Install dependencies (`npm ci`).
3. Run `npm run test:e2e`.

## GitHub Actions secrets

| Secret name | Required | Used for | Example value (placeholder only) |
| --- | --- | --- | --- |
| `PLAYWRIGHT_BASE_URL` | Yes | Base URL for Playwright runs in CI | `https://dev.app.vdpconnect.idxd.de` |
| `E2E_USER_EMAIL` | Yes | Default authenticated E2E login identity | `e2e-user@example.com` |
| `E2E_USER_PASSWORD` | Yes | Password for `E2E_USER_EMAIL` | `replace-with-strong-password` |
| `CLICKUP_API_TOKEN` | Yes (CI upload flow) | Upload Playwright JSON results and failure screenshots to ClickUp task | `pk_live_replace_with_clickup_token` |

## Local environment variables

| Variable | Required | Description | Example (placeholder only) |
| --- | --- | --- | --- |
| `PLAYWRIGHT_BASE_URL` | Yes | Target environment URL used by Playwright | `https://dev.app.vdpconnect.idxd.de` |
| `E2E_USER_EMAIL` | Yes | Default test-user email used by auth fixture | `e2e-user@example.com` |
| `E2E_USER_PASSWORD` | Yes | Default test-user password used by auth fixture | `replace-with-strong-password` |
| `CLICKUP_API_TOKEN` | Optional locally / required in CI upload flow | Token used only when uploading results to ClickUp | `pk_live_replace_with_clickup_token` |

Never commit real credentials or tokens.
