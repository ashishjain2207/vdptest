import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';
import { escapeForTextSelector } from '../utils/selectors';

export class HomeFeedPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get composer(): Locator {
    return this.byTestId('post-composer')
      .or(this.page.getByRole('textbox', { name: /post content/i }))
      .or(this.page.getByPlaceholder(/what would you like to share/i))
      .first();
  }

  get feedRegion(): Locator {
    return this.byTestId('home-feed').or(this.page.locator('main')).first();
  }

  async gotoFeed(): Promise<void> {
    await this.goto(routes.feed);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts|\/onboarding/i);
    await expect(this.feedRegion).toBeVisible();
  }

  async expectGuestRedirectedToLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/i);
  }

  postByText(text: string): Locator {
    const contentPattern = new RegExp(escapeForTextSelector(text), 'i');
    return this.byTestId('post-card')
      .filter({ hasText: contentPattern })
      .or(this.page.locator('article').filter({ hasText: contentPattern }))
      .or(this.page.getByText(contentPattern))
      .first();
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postByText(text)).toBeVisible();
  }

  async expectPostHidden(text: string): Promise<void> {
    await expect(this.page.getByText(new RegExp(escapeForTextSelector(text), 'i'))).toHaveCount(0);
  }
}
