import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';

const scenarioVersion = process.env.E2E_SCENARIO_VERSION?.trim() || 'v1';

function slugifyScenarioTitle(title: string): string {
  return title
    .replace(/@\w+/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function captureHighPriorityFailureScreenshot(page: Page, testInfo: TestInfo): Promise<void> {
  const isHighPriority = testInfo.title.includes('@high');
  const hasFailed = testInfo.status !== testInfo.expectedStatus;
  if (!isHighPriority || !hasFailed) {
    return;
  }

  const slug = slugifyScenarioTitle(testInfo.title) || 'scenario';
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  await fs.mkdir(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `${slug}_${scenarioVersion}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}
