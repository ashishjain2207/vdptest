import { expect, Locator, Page } from '@playwright/test';

type ProfileUpdateInput = {
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
  readonly profilePictureInput: Locator;
  readonly coverPhotoInput: Locator;
  readonly saveButton: Locator;
  readonly successMessage: Locator;
  readonly validationError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.displayNameInput = page
      .getByTestId('profile-display-name')
      .or(page.getByLabel(/display name|name/i))
      .or(page.getByPlaceholder(/display name|name/i))
      .first();
    this.bioInput = page
      .getByTestId('profile-bio')
      .or(page.getByLabel(/bio|about me|short bio/i))
      .or(page.getByPlaceholder(/bio|about/i))
      .first();
    this.websiteInput = page
      .getByTestId('profile-website')
      .or(page.getByLabel(/website/i))
      .or(page.getByPlaceholder(/website|https/i))
      .first();
    this.profilePictureInput = page
      .getByTestId('profile-picture-input')
      .or(page.locator('input[type="file"][name*="avatar" i]'))
      .or(page.locator('input[type="file"]').first());
    this.coverPhotoInput = page
      .getByTestId('cover-photo-input')
      .or(page.locator('input[type="file"][name*="cover" i]'))
      .or(page.locator('input[type="file"]').nth(1));
    this.saveButton = page
      .getByTestId('profile-save')
      .or(page.getByRole('button', { name: /save|update/i }))
      .first();
    this.successMessage = page
      .getByTestId('profile-save-success')
      .or(page.getByText(/profile updated|saved successfully|success/i))
      .first();
    this.validationError = page
      .getByTestId('profile-validation-error')
      .or(page.getByRole('alert'))
      .or(page.getByText(/invalid url|valid website|website.*invalid|validation/i))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile');
  }

  async updateProfile(data: ProfileUpdateInput): Promise<void> {
    if (data.displayName !== undefined) {
      await this.displayNameInput.fill(data.displayName);
    }

    if (data.bio !== undefined) {
      await this.bioInput.fill(data.bio);
    }

    if (data.website !== undefined) {
      await this.websiteInput.fill(data.website);
    }

    if (data.profilePicturePath) {
      await this.profilePictureInput.setInputFiles(data.profilePicturePath);
    }

    if (data.coverPhotoPath) {
      await this.coverPhotoInput.setInputFiles(data.coverPhotoPath);
    }

    await this.saveButton.click();
  }

  async expectProfileSaved(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  async expectInvalidWebsiteError(): Promise<void> {
    await expect(this.validationError).toBeVisible();
    await expect(this.validationError).toContainText(/url|website|valid/i);
  }

  async expectOnEditProfilePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/settings\/profile/);
  }
}
