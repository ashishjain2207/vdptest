import { expect, type Locator, type Page } from '@playwright/test';

export class AccountSettingsPage {
  readonly page: Page;
  readonly mainLandmark: Locator;
  readonly accountNavLink: Locator;
  readonly profileNavLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainLandmark = page.locator('main');
    this.accountNavLink = page.locator('a[href="/settings/account"]');
    this.profileNavLink = page.locator('a[href="/settings/profile"]');
    this.logoutButton = page.locator('div.bg-card.rounded-xl.border.border-border.p-2 > button[type="button"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/settings/account');
  }

  async expectVisible(): Promise<void> {
    await expect(this.mainLandmark).toBeVisible();
    await expect(this.accountNavLink).toBeVisible();
    await expect(this.profileNavLink).toBeVisible();
  }
}
