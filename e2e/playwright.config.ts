import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { getE2EConfig } from './utils/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = getE2EConfig();
const startCommand = process.env.E2E_START_COMMAND?.trim();

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(process.cwd(), 'playwright-report'), open: 'never' }],
  ],
  outputDir: path.resolve(process.cwd(), 'test-results'),
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: env.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
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
  webServer: startCommand
    ? {
        command: startCommand,
        url: env.baseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
