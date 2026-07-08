import { expect, Locator, Page } from '@playwright/test';

export class HomeFeedPage {
  readonly page: Page;
  readonly feedContainer: Locator;
  readonly createPostButton: Locator;
  readonly accessDeniedMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.feedContainer = page
      .getByTestId('home-feed')
      .or(page.getByTestId('feed-container'))
      .or(page.getByRole('main'))
      .first();
    this.createPostButton = page
      .getByTestId('create-post-button')
      .or(page.getByRole('button', { name: /create post|new post|post/i }))
      .first();
    this.accessDeniedMessage = page
      .getByTestId('access-denied-message')
      .or(page.getByText(/access denied|sign in|required|not authorized/i))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/posts');
  }

  postCardByText(text: string): Locator {
    return this.page
      .getByTestId('post-card')
      .filter({ hasText: text })
      .or(this.page.locator('article').filter({ hasText: text }))
      .or(this.page.getByText(text))
      .first();
  }

  async openCreatePost(): Promise<void> {
    await this.createPostButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts/);
    await expect(this.feedContainer).toBeVisible();
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postCardByText(text)).toBeVisible();
  }

  async expectGuestRedirectedAway(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login|\/signup|\/$/);
    await expect(this.accessDeniedMessage.or(this.page.getByRole('heading', { name: /login|sign in/i })).first()).toBeVisible();
  }
}
