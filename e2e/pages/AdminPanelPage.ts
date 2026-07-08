import { expect, type Locator, type Page } from '@playwright/test';

export class AdminPanelPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoModeration(): Promise<void> {
    await this.page.goto('/admin/content-moderation');
    await expect(this.page.getByTestId('admin-content-moderation-page')).toBeVisible();
  }

  async gotoUsers(): Promise<void> {
    await this.page.goto('/admin/users');
    await expect(this.page.getByTestId('admin-users-page')).toBeVisible();
  }

  async searchUsers(query: string): Promise<void> {
    const searchInput = this.page.getByTestId('admin-users-search');
    await searchInput.fill(query);
  }

  moderationCaseRowByText(text: string): Locator {
    return this.page.getByTestId('admin-moderation-case-row').filter({ hasText: text }).first();
  }

  async openModerationCase(text: string): Promise<void> {
    const row = this.moderationCaseRowByText(text);
    await expect(row).toBeVisible();
    await row.click();
  }

  async resolveOpenModerationCase(): Promise<void> {
    await this.page.getByTestId('admin-resolve-case-button').click();
  }

  async dismissOpenModerationCase(): Promise<void> {
    await this.page.getByTestId('admin-dismiss-case-button').click();
  }

  userRowByText(text: string): Locator {
    return this.page.getByTestId('admin-user-row').filter({ hasText: text }).first();
  }

  async openUserActions(text: string): Promise<void> {
    const row = this.userRowByText(text);
    await expect(row).toBeVisible();
    await row.getByTestId('admin-user-actions-trigger').click();
  }

  suspensionAction(): Locator {
    return this.page.getByTestId('admin-toggle-suspension-action');
  }
}
