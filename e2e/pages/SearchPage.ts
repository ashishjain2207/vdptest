import { expect, type Locator, type Page } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly globalSearchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.globalSearchInput = page.locator('[data-testid="header-global-search"]');
  }

  async expectVisible(): Promise<void> {
    await expect(this.globalSearchInput).toBeVisible();
  }
}
