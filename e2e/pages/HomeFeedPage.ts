import { expect, type Locator, type Page } from '@playwright/test';

export class HomeFeedPage {
  readonly page: Page;
  readonly composer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.composer = page.getByTestId('create-post-composer');
  }

  async goto(): Promise<void> {
    await this.page.goto('/posts');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts/u);
    await expect(this.composer.or(this.page.locator('text=/all caught up|no posts yet|log in to see posts/i'))).toBeVisible();
  }

  async expectAccessRestricted(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login|\/onboarding/u);
  }

  postCardByText(text: string): Locator {
    return this.page.getByTestId('post-card').filter({ hasText: text }).first();
  }
}
