import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

for (const candidate of [
  path.join(repoRoot, '.env'),
  path.join(repoRoot, '.env.local'),
  path.join(repoRoot, '.env.e2e'),
  path.join(repoRoot, '.env.e2e.local'),
  path.join(repoRoot, 'e2e', '.env.e2e'),
  path.join(repoRoot, 'e2e', '.env.e2e.local'),
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

const baseURL =
  process.env.E2E_BASE_URL
  ?? process.env.PLAYWRIGHT_BASE_URL
  ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: path.join(__dirname, 'test-results'),
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }]]
    : [['list'], ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
