import path from 'node:path';
import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const repoRoot = process.cwd();
const testResultsDir = path.resolve(repoRoot, 'test-results');
const playwrightReportDir = path.resolve(repoRoot, 'playwright-report');

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  outputDir: path.join(testResultsDir, 'artifacts'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    video: 'off',
    trace: 'off',
    screenshot: 'off',
  },
  reporter: [
    ['line'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? path.join(testResultsDir, 'results.json') }],
    ['html', { outputFolder: playwrightReportDir, open: 'never' }],
  ],
});
