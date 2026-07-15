import { expect, type Locator, type Page } from '@playwright/test';

export class PostDetailPage {
  readonly page: Page;
  readonly commentTextarea: Locator;
  readonly commentSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.commentTextarea = page.locator('textarea[placeholder]');
    this.commentSubmitButton = page.locator('button:has(svg)').filter({ hasText: '' }).last();
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.locator('main')).toBeVisible();
  }
}
