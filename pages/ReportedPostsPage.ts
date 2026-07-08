import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportedPostsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  reportedPost(content: string | RegExp): Locator {
    return this.byTestIdOr('reported-post-list', this.page.locator('main')).getByText(content).first();
  }

  async removeReportedPost(content: string | RegExp): Promise<void> {
    const row = this.reportedPost(content).locator('..');
    await row.getByRole('button', { name: /remove|delete|take down/i }).click();
    await this.page.getByRole('button', { name: /confirm|remove|delete/i }).last().click();
  }

  async expectReportedPostRemoved(content: string | RegExp): Promise<void> {
    await expect(this.reportedPost(content)).toBeHidden();
  }
}
