import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const baseOrigin = new URL(baseURL).origin;
const shouldStartWebServer =
  !process.env.PLAYWRIGHT_SKIP_WEB_SERVER &&
  ['localhost', '127.0.0.1', '0.0.0.0'].includes(new URL(baseURL).hostname);

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],
  use: {
    baseURL,
    testIdAttribute: 'data-testid',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: shouldStartWebServer
    ? {
      command: 'npm run dev -- --host 0.0.0.0',
      url: baseOrigin,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    }
    : undefined,
});
