import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomeFeedPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoFeed(): Promise<void> {
    await this.goto('/posts');
  }

  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole('textbox', { name: /post content|share/i })
        .or(this.page.getByText(/trending topics|people you may know|no posts yet/i))
        .first(),
    ).toBeVisible();
  }

  async expectGuestRedirectedToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?.*)?$/);
    await this.expectVisibleText(/sign in|welcome back/i);
  }

  async expectPostVisible(content: string): Promise<void> {
    await expect(this.page.getByText(content).first()).toBeVisible();
  }

  async expectPostNotVisible(content: string): Promise<void> {
    await expect(this.page.getByText(content)).toHaveCount(0);
  }
}
