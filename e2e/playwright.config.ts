import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const envFiles = [
  path.resolve(repoRoot, '.env'),
  path.resolve(repoRoot, '.env.local'),
  path.resolve(repoRoot, '.env.e2e'),
  path.resolve(__dirname, '.env'),
];

for (const filePath of envFiles) {
  dotenv.config({ path: filePath, override: false });
}

const baseURL = (process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const webServerCommand = (process.env.E2E_WEB_SERVER_COMMAND ?? '').trim();

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: path.resolve(__dirname, 'playwright-report') }]]
    : [['list'], ['html', { open: 'never', outputFolder: path.resolve(__dirname, 'playwright-report') }]],
  outputDir: path.resolve(__dirname, 'test-results'),
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: webServerCommand
    ? {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        cwd: path.resolve(__dirname, '..'),
        timeout: 120_000,
      }
    : undefined,
});
