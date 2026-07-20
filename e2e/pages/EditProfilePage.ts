import { expect, type Locator, type Page } from '@playwright/test';

export interface ProfileUpdateInput {
  displayName: string;
  bio: string;
  website: string;
}

export class EditProfilePage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  displayNameField(): Locator {
    return this.first(this.page.locator('#name'), this.page.getByLabel(/display name/i));
  }

  bioField(): Locator {
    return this.first(this.page.locator('#bio'), this.page.getByLabel(/short bio/i));
  }

  websiteField(): Locator {
    return this.first(this.page.locator('#website'), this.page.getByLabel(/website/i));
  }

  avatarInput(): Locator {
    return this.first(
      this.page.getByLabel(/upload profile picture/i),
      this.page.locator('input[type="file"]').nth(0),
    );
  }

  coverInput(): Locator {
    return this.first(
      this.page.getByLabel(/change cover image/i),
      this.page.locator('input[type="file"]').nth(1),
    );
  }

  saveButton(): Locator {
    return this.first(
      this.page.getByTestId('profile-save'),
      this.page.getByRole('button', { name: /save changes|save/i }),
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile');
    await expect(this.saveButton()).toBeVisible();
  }

  async updateProfile(input: ProfileUpdateInput): Promise<void> {
    await this.displayNameField().fill(input.displayName);
    await this.bioField().fill(input.bio);
    await this.websiteField().fill(input.website);
  }

  async uploadProfilePhoto(filePath: string): Promise<void> {
    await this.avatarInput().setInputFiles(filePath);
  }

  async uploadCoverPhoto(filePath: string): Promise<void> {
    await this.coverInput().setInputFiles(filePath);
  }

  async save(): Promise<void> {
    await this.saveButton().click();
  }

  async expectSaved(): Promise<void> {
    await expect(
      this.page.getByText(/profile updated successfully|profile created successfully/i),
    ).toBeVisible();
  }

  async expectWebsiteFieldInvalid(): Promise<void> {
    const isValid = await this.websiteField().evaluate((element) => {
      return (element as HTMLInputElement).checkValidity();
    });
    expect(isValid).toBe(false);
  }

  async expectStillOnEditProfilePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/settings\/profile(?:\?|$)/);
  }
}
