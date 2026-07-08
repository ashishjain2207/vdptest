import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportedPostsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  reportedPost(content: string): Locator {
    return this.byTestId('reported-post-row').filter({ hasText: content }).or(this.page.getByText(content)).first();
  }

  removeButtonFor(content: string): Locator {
    return this.reportedPost(content)
      .locator('..')
      .getByRole('button', { name: /remove|resolve|mark resolved|delete/i })
      .first();
  }

  get confirmRemoveButton(): Locator {
    return this.byTestId('reported-post-remove-confirm')
      .or(this.page.getByRole('button', { name: /remove|confirm|delete|mark resolved/i }))
      .last();
  }

  async openReport(content: string): Promise<void> {
    await this.reportedPost(content).click();
  }

  async removeReportedPost(content: string): Promise<void> {
    await this.openReport(content);
    const dialogAction = this.page.getByRole('button', { name: /remove|resolve|mark resolved|delete/i }).first();
    await dialogAction.click();
    if (await this.confirmRemoveButton.isVisible()) {
      await this.confirmRemoveButton.click();
    }
  }

  async expectReportedPostRemoved(content: string): Promise<void> {
    await expect(this.reportedPost(content)).toHaveCount(0);
  }
}
