import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class AdminPanelPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get contentModerationLink(): Locator {
    return this.byTestId('admin-content-moderation-link')
      .or(this.page.getByRole('link', { name: /content moderation|reports/i }))
      .first();
  }

  async gotoAdminModeration(): Promise<void> {
    await this.goto(routes.adminModeration);
    await expect(this.page.getByRole('heading', { name: /content moderation/i }).first()).toBeVisible();
  }

  async openReportedPosts(): Promise<void> {
    await this.gotoAdminModeration();
  }
}
