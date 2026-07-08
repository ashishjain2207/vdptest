import { expect, type Locator, type Page } from '@playwright/test';

export class EditProfilePage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly bioInput: Locator;
  readonly websiteInput: Locator;
  readonly avatarInput: Locator;
  readonly coverInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByTestId('profile-settings-name-input');
    this.bioInput = page.getByTestId('profile-settings-bio-input');
    this.websiteInput = page.getByTestId('profile-settings-website-input');
    this.avatarInput = page.getByTestId('profile-settings-avatar-input');
    this.coverInput = page.getByTestId('profile-settings-cover-input');
    this.saveButton = page.getByTestId('profile-settings-save-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile');
    await expect(this.saveButton).toBeVisible();
  }

  async saveProfile(data: {
    displayName: string;
    bio: string;
    website: string;
    avatarPath?: string;
    coverPath?: string;
  }): Promise<void> {
    await this.nameInput.fill(data.displayName);
    await this.bioInput.fill(data.bio);
    await this.websiteInput.fill(data.website);

    if (data.avatarPath) {
      await this.avatarInput.setInputFiles(data.avatarPath);
    }

    if (data.coverPath) {
      await this.coverInput.setInputFiles(data.coverPath);
    }

    await this.saveButton.click();
  }

  invalidWebsiteMessage(): Locator {
    return this.page.locator('text=/invalid|website|url/i').first();
  }
}
