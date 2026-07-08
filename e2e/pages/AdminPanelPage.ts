import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPanelPage extends BasePage {
  async goTo(): Promise<void> {
    await this.goto('/admin');
    await expect(this.page).toHaveURL(/\/admin/);
  }

  async openReportedPosts(): Promise<void> {
    await this.goto('/admin/content-moderation');
    await expect(
      this.locatorAny(
        this.page.getByTestId('reported-posts'),
        this.page.getByRole('heading', { name: /content moderation|reports|reported posts/i }),
        this.page.getByText(/reported|moderation queue|content moderation/i),
      ),
    ).toBeVisible();
  }
}
