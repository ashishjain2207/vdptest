import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EditProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoProfileSettings(): Promise<void> {
    await this.goto('/settings/profile');
  }

  async setWebsite(url: string): Promise<void> {
    await this.page.locator('#website').fill(url);
  }

  async save(): Promise<void> {
    await this.clickButton(/save changes|save/i);
  }

  async expectInvalidWebsiteValidation(): Promise<void> {
    const website = this.page.locator('#website');
    await expect(website).toBeVisible();
    await expect
      .poll(async () => website.evaluate((input) => (input as HTMLInputElement).validity.valid))
      .toBe(false);
  }
}
