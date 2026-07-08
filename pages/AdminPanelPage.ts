import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPanelPage extends BasePage {
  readonly contentModerationLink: Locator;

  constructor(page: Page) {
    super(page);
    this.contentModerationLink = this.byTestIdOr(
      'admin-content-moderation-link',
      page.getByRole('link', { name: /content moderation|reported content/i }).first(),
    );
  }

  async open(): Promise<void> {
    await this.goto('/admin');
  }

  async openContentModeration(): Promise<void> {
    await this.goto('/admin/content-moderation');
    await expect(this.page).toHaveURL(/\/admin\/content-moderation/);
  }
}
