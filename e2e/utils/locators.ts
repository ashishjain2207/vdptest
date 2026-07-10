import { type Locator, type Page } from '@playwright/test';

async function exists(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0;
}

export async function firstExistingLocator(page: Page, selectors: string[]): Promise<Locator> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await exists(locator)) {
      return locator;
    }
  }

  throw new Error(`No locator matched any selector: ${selectors.join(', ')}`);
}

export async function fillFirst(page: Page, selectors: string[], value: string): Promise<void> {
  const locator = await firstExistingLocator(page, selectors);
  await locator.fill(value);
}

export async function clickFirst(page: Page, selectors: string[]): Promise<void> {
  const locator = await firstExistingLocator(page, selectors);
  await locator.click();
}

export async function checkFirst(page: Page, selectors: string[]): Promise<void> {
  const locator = await firstExistingLocator(page, selectors);
  await locator.check();
}

export async function isAnyVisible(page: Page, selectors: string[]): Promise<boolean> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0 && (await locator.isVisible())) {
      return true;
    }
  }
  return false;
}
