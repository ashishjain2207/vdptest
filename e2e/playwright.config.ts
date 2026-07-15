import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    video: 'off',
    trace: 'off',
    screenshot: 'off',
  },
  reporter: [
    ['line'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
});
