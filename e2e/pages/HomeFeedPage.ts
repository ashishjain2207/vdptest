import { expect, type Locator, type Page } from '@playwright/test';

export class HomeFeedPage {
  readonly page: Page;
  readonly feedContainer: Locator;
  readonly createPostButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feedContainer = page.getByTestId('home-feed').or(page.locator('main')).first();
    this.createPostButton = page
      .getByTestId('create-post-button')
      .or(page.getByRole('button', { name: /create post|new post|post/i }))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/posts');
    await expect(this.feedContainer).toBeVisible();
  }

  async openCreatePost(): Promise<void> {
    const composer = this.page.getByTestId('post-composer').or(this.page.getByLabel(/post content|share/i)).first();
    if (await composer.count() > 0 && await composer.isVisible()) {
      return;
    }
    await this.createPostButton.click();
  }

  postCardByText(text: string): Locator {
    return this.page.getByTestId('post-card').filter({ hasText: text }).or(this.page.locator('article, [role="article"]').filter({ hasText: text })).first();
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postCardByText(text)).toBeVisible();
  }

  async expectPostNotVisible(text: string): Promise<void> {
    await expect(this.postCardByText(text)).toHaveCount(0);
  }

  async expectAccessDeniedRedirect(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(login|access-denied|$)/);
    await expect(
      this.page.getByText(/log in|sign in|access denied|not authorized|landing/i).first(),
    ).toBeVisible();
  }
}
