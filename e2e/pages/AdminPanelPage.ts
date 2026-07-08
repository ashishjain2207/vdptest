import { expect, type Locator, type Page } from '@playwright/test';

export class AdminPanelPage {
  readonly page: Page;
  readonly moderationQueue: Locator;
  readonly userSearch: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.moderationQueue = page.getByTestId('admin-moderation-queue').or(page.locator('main')).first();
    this.userSearch = page.getByTestId('admin-users-search').or(page.getByPlaceholder(/search/i)).first();
    this.successToast = page.locator('[data-sonner-toast]').or(page.getByText(/success|resolved|suspended|unsuspended|reactivated/i)).first();
  }

  async gotoReportedPosts(): Promise<void> {
    await this.page.goto('/admin/content-moderation');
    await expect(this.moderationQueue).toBeVisible();
  }

  async openReportedPost(contentPreview: string): Promise<void> {
    const row = this.page.locator('li, tr, article, [data-testid="reported-post-row"]').filter({ hasText: contentPreview }).first();
    await expect(row).toBeVisible();
    await row.click();
  }

  async removeReportedPost(contentPreview: string): Promise<void> {
    await this.openReportedPost(contentPreview);
    await this.page
      .getByTestId('moderation-remove-post')
      .or(this.page.getByRole('button', { name: /remove|delete|resolve/i }))
      .last()
      .click();
    const confirm = this.page.getByRole('button', { name: /confirm|remove|delete|resolve|yes/i }).last();
    if (await confirm.count() > 0 && await confirm.isVisible()) {
      await confirm.click();
    }
  }

  async expectModerationSuccess(): Promise<void> {
    await expect(this.successToast).toBeVisible();
  }

  async gotoUserManagement(): Promise<void> {
    await this.page.goto('/admin/users');
    await expect(this.userSearch).toBeVisible();
  }

  async searchUser(query: string): Promise<void> {
    await this.userSearch.fill(query);
    await expect(this.page.locator('tbody, [data-testid="admin-users-results"], main')).toContainText(query, { ignoreCase: true });
  }

  userRow(query: string): Locator {
    return this.page.locator('tr, [data-testid="admin-user-row"]').filter({ hasText: query }).first();
  }

  async suspendUser(query: string): Promise<void> {
    const row = this.userRow(query);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /actions|more/i }).click();
    await this.page.getByRole('menuitem', { name: /suspend/i }).click();
  }

  async reactivateUser(query: string): Promise<void> {
    const row = this.userRow(query);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /actions|more/i }).click();
    await this.page.getByRole('menuitem', { name: /unsuspend|reactivate|activate/i }).click();
  }

  async expectUserSuspended(query: string): Promise<void> {
    await expect(this.userRow(query)).toContainText(/suspended/i);
  }

  async expectUserActive(query: string): Promise<void> {
    await expect(this.userRow(query)).toContainText(/active|pending/i);
  }
}
