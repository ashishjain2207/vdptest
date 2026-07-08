import { expect, type Locator, type Page } from '@playwright/test';

async function fillIfPresent(locator: Locator, value?: string): Promise<void> {
  if (!value || await locator.count() === 0 || !await locator.first().isVisible()) {
    return;
  }
  await locator.first().fill(value);
}

async function uploadIfPresent(locator: Locator, filePath?: string): Promise<void> {
  if (!filePath || await locator.count() === 0) {
    return;
  }
  await locator.first().setInputFiles(filePath);
}

export type ProfileUpdateInput = {
  displayName?: string;
  bio?: string;
  website?: string;
  profilePicturePath?: string;
  coverPhotoPath?: string;
};

export class EditProfilePage {
  readonly page: Page;
  readonly displayNameInput: Locator;
  readonly bioInput: Locator;
  readonly websiteInput: Locator;
  readonly avatarInput: Locator;
  readonly coverInput: Locator;
  readonly saveButton: Locator;
  readonly validationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.displayNameInput = page.getByTestId('profile-display-name').or(page.getByLabel(/display name|name/i)).or(page.locator('#name')).first();
    this.bioInput = page.getByTestId('profile-bio').or(page.getByLabel(/bio|about/i)).or(page.locator('textarea[name="bio"], textarea')).first();
    this.websiteInput = page.getByTestId('profile-website').or(page.getByLabel(/website/i)).or(page.locator('#website, input[name="website"]')).first();
    this.avatarInput = page.getByTestId('profile-picture-input').or(page.locator('input[type="file"]').nth(0));
    this.coverInput = page.getByTestId('cover-photo-input').or(page.locator('input[type="file"]').nth(1));
    this.saveButton = page.getByTestId('profile-save').or(page.getByRole('button', { name: /save|update/i })).first();
    this.validationMessage = page.getByRole('alert').or(page.locator('.text-destructive, [data-sonner-toast]')).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile');
    await expect(this.displayNameInput).toBeVisible();
  }

  async updateProfile(data: ProfileUpdateInput): Promise<void> {
    await fillIfPresent(this.displayNameInput, data.displayName);
    await fillIfPresent(this.bioInput, data.bio);
    await fillIfPresent(this.websiteInput, data.website);
    await uploadIfPresent(this.avatarInput, data.profilePicturePath);
    await uploadIfPresent(this.coverInput, data.coverPhotoPath);
    await this.saveButton.click();
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(this.validationMessage.or(this.page.getByText(/saved|updated|success/i)).first()).toBeVisible();
  }

  async expectInvalidWebsiteUrl(): Promise<void> {
    await expect(this.page).toHaveURL(/\/settings\/profile/);
    await expect(this.validationMessage).toBeVisible();
    await expect(this.validationMessage).toContainText(/website|url|invalid/i);
  }
}
