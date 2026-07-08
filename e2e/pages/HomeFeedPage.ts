import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomeFeedPage extends BasePage {
  async goTo(): Promise<void> {
    await this.goto('/posts');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts(?:\?|$)/);
    await expect(
      this.locatorAny(
        this.page.getByTestId('home-feed'),
        this.page.getByRole('main'),
        this.page.getByText(/feed|posts|what.*mind|share/i),
      ),
    ).toBeVisible();
  }

  postByText(text: string) {
    return this.locatorAny(
      this.page.getByTestId(`post-${text}`),
      this.page.getByText(text),
    );
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postByText(text)).toBeVisible();
  }

  async expectPostRemoved(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toHaveCount(0);
  }

  async openPostByText(text: string): Promise<void> {
    await this.postByText(text).click();
  }

  async expectGuestRedirect(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login|\/$/);
  }
}
