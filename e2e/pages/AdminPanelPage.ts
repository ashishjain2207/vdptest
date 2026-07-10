import { expect, type Page } from '@playwright/test';
import { clickFirst, fillFirst } from '../utils/locators';

export class AdminPanelPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }

  async openReportedPosts(): Promise<void> {
    const target = this.page.getByRole('link', { name: /reported posts|content moderation|reports/i }).first();
    if (await target.count()) {
      await target.click();
    } else {
      await this.page.goto('/admin/content-moderation');
    }
  }

  async removeReportedPost(postText: string): Promise<void> {
    const row = this.page
      .locator('[data-testid="reported-post-row"], [data-testid="reported-post-item"], tr, article')
      .filter({ hasText: postText })
      .first();
    await expect(row).toBeVisible();
    await row.locator('[data-testid="remove-post"], button:has-text("Remove"), button:has-text("Delete")').first().click();
    const confirm = this.page.locator('[data-testid="confirm-remove"], [data-testid="confirm-delete"], button:has-text("Confirm")').first();
    if (await confirm.count()) {
      await confirm.click();
    }
  }

  async expectPostRemoved(postText: string): Promise<void> {
    await expect(this.page.getByText(postText)).toHaveCount(0);
  }

  async openUserManagement(): Promise<void> {
    const link = this.page.getByRole('link', { name: /users|user management/i }).first();
    if (await link.count()) {
      await link.click();
    } else {
      await this.page.goto('/admin/users');
    }
  }

  async searchUser(identifier: string): Promise<void> {
    const searchInput = this.page.locator('[data-testid="admin-user-search"], input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.count()) {
      await fillFirst(this.page, ['[data-testid="admin-user-search"]', 'input[placeholder*="Search"]', 'input[type="search"]'], identifier);
    }
  }

  async suspendUser(): Promise<void> {
    await clickFirst(this.page, ['[data-testid="suspend-user-button"]', 'button:has-text("Suspend")']);
    const confirm = this.page.locator('[data-testid="confirm-suspend"], button:has-text("Confirm")').first();
    if (await confirm.count()) {
      await confirm.click();
    }
  }

  async reactivateUser(): Promise<void> {
    await clickFirst(this.page, ['[data-testid="reactivate-user-button"]', 'button:has-text("Reactivate")']);
    const confirm = this.page.locator('[data-testid="confirm-reactivate"], button:has-text("Confirm")').first();
    if (await confirm.count()) {
      await confirm.click();
    }
  }

  async expectUserStatus(status: 'suspended' | 'active'): Promise<void> {
    await expect(this.page.getByText(new RegExp(status, 'i')).first()).toBeVisible();
  }
}
