import { expect, type Page } from '@playwright/test';
import { clickFirst, isAnyVisible } from '../utils/locators';

export class HomeFeedPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/posts');
  }

  async expectGuestRedirectedFromFeed(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?.*)?$/);
  }

  async expectFeedVisible(): Promise<void> {
    const visible = await isAnyVisible(this.page, [
      '[data-testid="feed-container"]',
      '[data-testid="create-post-trigger"]',
      'a[aria-label="VDPConnect home"]',
      '[data-sidebar="sidebar"]',
    ]);
    expect(visible).toBeTruthy();
  }

  async openCreatePostComposer(): Promise<void> {
    const namedButton = this.page.getByRole('button', { name: /create post|post/i }).first();
    if (await namedButton.count()) {
      await namedButton.click();
      return;
    }

    await clickFirst(this.page, ['[data-testid="create-post-trigger"]', '[data-testid="post-create-button"]']);
  }
}
