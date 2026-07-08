import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportedPostsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  reportedPost(preview: string) {
    return this.page.getByText(preview).first();
  }

  async openReportedPost(preview: string): Promise<void> {
    await this.reportedPost(preview).click();
  }

  async resolveReportedPost(preview: string): Promise<void> {
    await this.openReportedPost(preview);
    await this.page.getByRole('button', { name: /resolve/i }).click();
    await this.expectToastOrInlineMessage(/resolved/i);
  }

  async expectPostRemovedFromPendingQueue(preview: string): Promise<void> {
    await expect(this.reportedPost(preview)).toHaveCount(0);
  }
}
