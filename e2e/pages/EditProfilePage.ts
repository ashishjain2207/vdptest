import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EditProfilePage extends BasePage {
  async goTo(): Promise<void> {
    await this.goto('/settings/profile');
    await expect(this.page).toHaveURL(/\/settings\/profile/);
  }

  async enterWebsiteUrl(url: string): Promise<void> {
    await this.field('website', [/website/i, /website url/i]).fill(url);
  }

  async save(): Promise<void> {
    await this.byTestIdOrRole('save-profile-button', 'button', /save|save changes|update profile/i).click();
  }

  async expectInvalidWebsiteValidation(): Promise<void> {
    await this.expectToastOrInlineMessage(/website|url|valid|invalid/i);
    await expect(this.page).toHaveURL(/\/settings\/profile/);
  }
}
