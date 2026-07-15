import { expect, type Locator, type Page } from '@playwright/test';

export class PostComposer {
  readonly page: Page;
  readonly contentTextarea: Locator;
  readonly addImageInput: Locator;
  readonly publishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.contentTextarea = page.locator('textarea[aria-label]').first();
    this.addImageInput = page.locator('input[type="file"][aria-label]');
    this.publishButton = page.locator('button[type="button"]').last();
  }

  async expectVisible(): Promise<void> {
    await expect(this.contentTextarea).toBeVisible();
    await expect(this.addImageInput).toBeAttached();
  }
}
