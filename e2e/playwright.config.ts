import path from 'node:path';
import { defineConfig } from '@playwright/test';
import { loadEnv } from 'vite';

const isCI = Boolean(process.env.CI);
const repoRoot = process.cwd();
const testResultsDir = path.resolve(repoRoot, 'test-results');
const playwrightReportDir = path.resolve(repoRoot, 'playwright-report');
const e2eEnv = loadEnv('e2e', repoRoot, '');
Object.assign(process.env, e2eEnv);
const configuredWorkers = Number.parseInt(process.env.E2E_WORKERS ?? '1', 10);
const workers = Number.isFinite(configuredWorkers) && configuredWorkers > 0 ? configuredWorkers : 1;

function resolveRepoPath(filePath, fallbackPath) {
  const targetPath = filePath ?? fallbackPath;
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(repoRoot, targetPath);
}

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  workers,
  outputDir: path.join(testResultsDir, 'artifacts'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    video: 'off',
    trace: 'off',
    screenshot: 'off',
  },
  reporter: [
    ['line'],
    [
      'json',
      {
        outputFile: resolveRepoPath(
          process.env.PLAYWRIGHT_JSON_OUTPUT_NAME,
          path.join(testResultsDir, 'results.json'),
        ),
      },
    ],
    ['html', { outputFolder: playwrightReportDir, open: 'never' }],
  ],
});
