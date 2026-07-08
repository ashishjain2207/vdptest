import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface EditProfileFormData {
  name?: string;
  handle?: string;
  bio?: string;
  company?: string;
  contactEmail?: string;
  linkedInProfileUrl?: string;
  description?: string;
  website?: string;
  homeCountry?: string;
}

export class EditProfilePage {
  readonly page: Page;
  readonly root: Locator;
  readonly avatarInput: Locator;
  readonly coverInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('edit-profile-page');
    this.avatarInput = page.getByTestId('edit-profile-avatar-input');
    this.coverInput = page.getByTestId('edit-profile-cover-input');
    this.saveButton = page.getByTestId('edit-profile-save');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile', { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async selectHomeCountry(countryCode: string): Promise<void> {
    const input = this.page.locator('#home-country-settings');
    await input.click();
    await input.fill(countryCode);
    await input.press('Enter');
  }

  async fillForm(data: EditProfileFormData): Promise<void> {
    if (data.name !== undefined) {
      await this.page.locator('#name').fill(data.name);
    }
    if (data.handle !== undefined) {
      await this.page.locator('#handle').fill(data.handle);
    }
    if (data.bio !== undefined) {
      await this.page.locator('#bio').fill(data.bio);
    }
    if (data.company !== undefined) {
      await this.page.locator('#company').fill(data.company);
    }
    if (data.contactEmail !== undefined) {
      await this.page.locator('#contactEmail').fill(data.contactEmail);
    }
    if (data.linkedInProfileUrl !== undefined) {
      await this.page.locator('#linkedInProfileUrl').fill(data.linkedInProfileUrl);
    }
    if (data.description !== undefined) {
      await this.page.locator('#description').fill(data.description);
    }
    if (data.website !== undefined) {
      await this.page.locator('#website').fill(data.website);
    }
    if (data.homeCountry) {
      await this.selectHomeCountry(data.homeCountry);
    }
  }

  async uploadAvatar(filePath: string): Promise<void> {
    await this.avatarInput.setInputFiles(filePath);
  }

  async uploadCover(filePath: string): Promise<void> {
    await this.coverInput.setInputFiles(filePath);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
