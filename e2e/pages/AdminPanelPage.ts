import { expect, Locator, Page } from '@playwright/test';

export class AdminPanelPage {
  readonly page: Page;
  readonly reportedPostsSection: Locator;
  readonly userManagementSection: Locator;
  readonly removePostButton: Locator;
  readonly confirmActionButton: Locator;
  readonly suspendUserButton: Locator;
  readonly reactivateUserButton: Locator;
  readonly statusMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reportedPostsSection = page
      .getByTestId('reported-posts-section')
      .or(page.getByRole('region', { name: /reported posts|content moderation/i }))
      .or(page.getByRole('main'))
      .first();
    this.userManagementSection = page
      .getByTestId('user-management-section')
      .or(page.getByRole('region', { name: /users|user management/i }))
      .or(page.getByRole('main'))
      .first();
    this.removePostButton = page
      .getByTestId('admin-remove-post')
      .or(page.getByRole('button', { name: /remove|delete/i }))
      .first();
    this.confirmActionButton = page
      .getByTestId('admin-confirm-action')
      .or(page.getByRole('button', { name: /confirm|yes|remove|delete|suspend|reactivate/i }))
      .last();
    this.suspendUserButton = page
      .getByTestId('admin-suspend-user')
      .or(page.getByRole('button', { name: /suspend/i }))
      .first();
    this.reactivateUserButton = page
      .getByTestId('admin-reactivate-user')
      .or(page.getByRole('button', { name: /reactivate|activate/i }))
      .first();
    this.statusMessage = page
      .getByTestId('admin-status-message')
      .or(page.getByRole('status'))
      .or(page.getByRole('alert'))
      .first();
  }

  async gotoReportedPosts(): Promise<void> {
    await this.page.goto('/admin/content-moderation');
  }

  async gotoUserManagement(): Promise<void> {
    await this.page.goto('/admin/users');
  }

  reportedPostByText(text: string): Locator {
    return this.reportedPostsSection
      .getByTestId('reported-post-row')
      .filter({ hasText: text })
      .or(this.reportedPostsSection.locator('tr, article, li').filter({ hasText: text }))
      .first();
  }

  userRowByName(username: string): Locator {
    return this.userManagementSection
      .getByTestId('user-account-row')
      .filter({ hasText: username })
      .or(this.userManagementSection.locator('tr, article, li').filter({ hasText: username }))
      .first();
  }

  async removeReportedPost(text: string): Promise<void> {
    await this.reportedPostByText(text).click();
    await this.removePostButton.click();
    await this.confirmActionButton.click();
  }

  async suspendUser(username: string): Promise<void> {
    await this.userRowByName(username).click();
    await this.suspendUserButton.click();
    await this.confirmActionButton.click();
  }

  async reactivateUser(username: string): Promise<void> {
    await this.userRowByName(username).click();
    await this.reactivateUserButton.click();
    await this.confirmActionButton.click();
  }

  async expectReportedPostRemoved(text: string): Promise<void> {
    await expect(this.reportedPostByText(text)).toBeHidden();
    await expect(this.statusMessage.or(this.page.getByText(/removed|deleted|success/i)).first()).toBeVisible();
  }

  async expectUserSuspended(username: string): Promise<void> {
    await expect(this.userRowByName(username)).toContainText(/suspended|inactive/i);
  }

  async expectUserActive(username: string): Promise<void> {
    await expect(this.userRowByName(username)).toContainText(/active|reactivated/i);
  }
}
