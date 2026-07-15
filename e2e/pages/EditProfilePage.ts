import { expect, type Locator, type Page } from '@playwright/test';

export class EditProfilePage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly handleInput: Locator;
  readonly bioInput: Locator;
  readonly locationInput: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#name');
    this.handleInput = page.locator('#handle');
    this.bioInput = page.locator('#bio');
    this.locationInput = page.locator('#location');
    this.cancelButton = page.locator('button').nth(0);
    this.saveButton = page.locator('button').nth(1);
  }

  async open(): Promise<void> {
    await this.page.goto('/settings/profile');
    await expect(this.nameInput).toBeVisible();
  }
}
