import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomeFeedPage extends BasePage {
  readonly feed: Locator;

  constructor(page: Page) {
    super(page);
    this.feed = this.byTestIdOr('home-feed', page.locator('main').or(page.locator('[role="feed"]')).first());
  }

  async open(): Promise<void> {
    await this.goto('/posts');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts(?:\/|\?|$)/);
    await expect(this.feed).toBeVisible();
  }

  postByText(content: string | RegExp): Locator {
    return this.page.getByText(content).first();
  }

  async expectPostVisible(content: string | RegExp): Promise<void> {
    await expect(this.postByText(content)).toBeVisible();
  }

  async expectPostHidden(content: string | RegExp): Promise<void> {
    await expect(this.postByText(content)).toBeHidden();
  }

  async expectGuestRedirectedToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
