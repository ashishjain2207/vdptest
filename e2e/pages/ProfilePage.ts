import { expect, type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly mainLandmark: Locator;
  readonly followButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainLandmark = page.locator('main');
    this.followButton = page.locator('button').filter({ hasText: /follow|following/i }).first();
  }

  async open(userId: string): Promise<void> {
    await this.page.goto(`/profile/${userId}`);
  }

  async expectVisible(): Promise<void> {
    await expect(this.mainLandmark).toBeVisible();
  }
}
