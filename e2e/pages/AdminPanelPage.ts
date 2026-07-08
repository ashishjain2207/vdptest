import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPanelPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoContentModeration(): Promise<void> {
    await this.goto('/admin/content-moderation');
  }

  async expectModerationQueueLoaded(): Promise<void> {
    await expect(this.page.getByText(/content moderation|reported content|moderation/i).first()).toBeVisible();
  }
}
