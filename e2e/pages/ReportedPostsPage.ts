import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportedPostsPage extends BasePage {
  reportedPost(content: string) {
    return this.locatorAny(
      this.page.getByTestId(`reported-post-${content}`),
      this.page.getByText(content),
    );
  }

  async openReportedPost(content: string): Promise<void> {
    await this.reportedPost(content).click();
  }

  async removeReportedPost(content: string): Promise<void> {
    await this.openReportedPost(content);
    await this.locatorAny(
      this.page.getByTestId('remove-reported-post'),
      this.page.getByRole('button', { name: /remove|delete|resolve/i }),
    ).click();
    const confirm = this.locatorAny(
      this.page.getByTestId('confirm-remove-reported-post'),
      this.page.getByRole('button', { name: /confirm|remove|delete|resolve/i }),
    );
    await this.clickIfPresent(confirm);
  }

  async expectReportedPostRemoved(content: string): Promise<void> {
    await this.expectToastOrInlineMessage(/removed|resolved|deleted/i);
    await expect(this.page.getByText(content)).toHaveCount(0);
  }
}
