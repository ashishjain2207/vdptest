import type { Page, Locator, AriaRole } from '@playwright/test';

export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

export function byTestId(page: Page, id: string): Locator {
  return page.locator(testId(id));
}

export function byDynamicTestId(page: Page, prefix: string, value: string): Locator {
  return byTestId(page, `${prefix}-${value}`);
}

export function byTestIdOrRole(
  page: Page,
  id: string,
  role: AriaRole,
  options: Parameters<Page['getByRole']>[1],
): Locator {
  return byTestId(page, id).or(page.getByRole(role, options));
}

export function byTestIdOrText(page: Page, id: string, text: string | RegExp): Locator {
  return byTestId(page, id).or(page.getByText(text));
}
