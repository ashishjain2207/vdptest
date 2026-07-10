import { expect, type Page } from '@playwright/test';
import { clickFirst, fillFirst } from '../utils/locators';

export interface ProfileUpdateData {
  displayName: string;
  bio: string;
  website: string;
}

export class EditProfilePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile');
  }

  async updateProfile(data: ProfileUpdateData): Promise<void> {
    await fillFirst(this.page, ['[data-testid="profile-display-name"]', 'input[name="displayName"]', 'input[name="name"]'], data.displayName);
    await fillFirst(this.page, ['[data-testid="profile-bio"]', 'textarea[name="bio"]', 'textarea'], data.bio);
    await fillFirst(this.page, ['[data-testid="profile-website"]', 'input[name="website"]', 'input[type="url"]'], data.website);
  }

  async uploadAvatarAndCover(): Promise<void> {
    const avatarInput = this.page.locator('[data-testid="profile-avatar-upload"], input[type="file"][name*="avatar"]').first();
    if (await avatarInput.count()) {
      await avatarInput.setInputFiles({
        name: 'avatar.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64'),
      });
    }

    const coverInput = this.page.locator('[data-testid="profile-cover-upload"], input[type="file"][name*="cover"]').first();
    if (await coverInput.count()) {
      await coverInput.setInputFiles({
        name: 'cover.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64'),
      });
    }
  }

  async save(): Promise<void> {
    await clickFirst(this.page, ['[data-testid="profile-save-button"]', 'button:has-text("Save")', 'button:has-text("Update")']);
  }

  async expectSavedProfileVisible(displayName: string, website: string): Promise<void> {
    await expect(this.page.getByText(displayName)).toBeVisible();
    await expect(this.page.getByText(website)).toBeVisible();
  }

  async expectInvalidWebsiteError(): Promise<void> {
    await expect(this.page.getByText(/invalid.*url|website|valid url/i)).toBeVisible();
  }
}
