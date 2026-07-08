import type { Page } from '@playwright/test';

export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

export function dynamicTestId(prefix: string, value: string): string {
  return testId(`${prefix}-${value}`);
}

export function byTestId(page: Page, id: string) {
  return page.locator(testId(id));
}
