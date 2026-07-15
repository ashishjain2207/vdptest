import { expect, type Locator, type Page } from '@playwright/test';

export class HomeFeedPage {
  readonly page: Page;
  readonly mainLandmark: Locator;
  readonly postCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainLandmark = page.locator('main');
    this.postCards = page.locator('article');
  }

  async open(): Promise<void> {
    await this.page.goto('/posts');
  }

  async expectShellVisible(): Promise<void> {
    await expect(this.mainLandmark).toBeVisible();
  }
}
