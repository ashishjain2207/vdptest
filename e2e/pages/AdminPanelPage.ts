import { expect, type Locator, type Page } from '@playwright/test';

export class AdminPanelPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  async gotoModeration(): Promise<void> {
    await this.page.goto('/admin/content-moderation');
    await expect(this.page.getByRole('heading', { name: /moderation|flag/i })).toBeVisible();
  }

  async gotoUsers(): Promise<void> {
    await this.page.goto('/admin/users');
    await expect(this.page.getByRole('heading', { name: /users|roles/i })).toBeVisible();
  }

  async openModerationCaseByPreview(preview: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(preview, 'i') }).click().catch(async () => {
      await this.page.locator('button').filter({ hasText: preview }).first().click();
    });
  }

  async openModerationCaseById(caseId: string): Promise<void> {
    await this.page.locator('button').filter({ hasText: caseId }).first().click();
  }

  async resolveOpenModerationCase(): Promise<void> {
    await this.page.getByRole('button', { name: /resolve case/i }).click();
  }

  async expectModerationStatus(status: RegExp): Promise<void> {
    await expect(this.page.getByText(status)).toBeVisible();
  }

  searchField(): Locator {
    return this.first(
      this.page.getByTestId('admin-users-search'),
      this.page.getByPlaceholder(/search/i),
    );
  }

  userRow(searchText: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: searchText }).first();
  }

  async searchUser(searchText: string): Promise<void> {
    await this.searchField().fill(searchText);
    await expect(this.userRow(searchText)).toBeVisible();
  }

  async openUserActions(searchText: string): Promise<void> {
    const row = this.userRow(searchText);
    await row.getByRole('button', { name: /actions/i }).click();
  }

  async suspendUser(searchText: string): Promise<void> {
    await this.openUserActions(searchText);
    await this.page.getByRole('menuitem', { name: /suspend user/i }).click();
  }

  async unsuspendUser(searchText: string): Promise<void> {
    await this.openUserActions(searchText);
    await this.page.getByRole('menuitem', { name: /unsuspend user/i }).click();
  }

  async expectUserStatus(searchText: string, status: RegExp): Promise<void> {
    await expect(this.userRow(searchText).getByText(status)).toBeVisible();
  }
}
