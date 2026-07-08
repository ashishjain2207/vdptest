import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class AdminPanelPage {
  readonly page: Page;
  readonly usersRoot: Locator;
  readonly usersTable: Locator;
  readonly usersSearch: Locator;
  readonly moderationRoot: Locator;
  readonly moderationList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usersRoot = page.getByTestId('admin-users-page');
    this.usersTable = page.getByTestId('admin-users-table');
    this.usersSearch = page.getByTestId('admin-users-search');
    this.moderationRoot = page.getByTestId('admin-content-moderation-page');
    this.moderationList = page.getByTestId('admin-content-moderation-list');
  }

  async gotoUsers(): Promise<void> {
    await this.page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
  }

  async gotoContentModeration(): Promise<void> {
    await this.page.goto('/admin/content-moderation', { waitUntil: 'domcontentloaded' });
  }

  async expectUsersLoaded(): Promise<void> {
    await expect(this.usersRoot).toBeVisible();
    await expect(this.usersTable).toBeVisible();
  }

  async expectModerationLoaded(): Promise<void> {
    await expect(this.moderationRoot).toBeVisible();
  }

  userRowById(userId: string): Locator {
    return this.page.locator(`[data-testid="admin-user-row"][data-user-id="${userId}"]`);
  }

  userRowByHandle(handle: string): Locator {
    return this.page.getByTestId('admin-user-row').filter({ hasText: `@${handle}` }).first();
  }

  async searchUsers(query: string): Promise<void> {
    await this.usersSearch.fill(query);
  }

  async openUserActions(row: Locator): Promise<void> {
    await row.getByTestId('admin-user-actions').click();
  }

  async openChangeRole(row: Locator): Promise<void> {
    await this.openUserActions(row);
    await this.page.getByTestId('admin-user-change-role').click();
  }

  async openSuspendToggle(row: Locator): Promise<void> {
    await this.openUserActions(row);
    await this.page.getByTestId('admin-user-suspend-toggle').click();
  }

  moderationItems(): Locator {
    return this.page.getByTestId('admin-content-moderation-item');
  }

  moderationItem(caseId: string): Locator {
    return this.page.locator(`[data-testid="admin-content-moderation-item"][data-case-id="${caseId}"]`);
  }

  async openFirstModerationItem(): Promise<void> {
    await this.moderationItems().first().click();
  }
}
