import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class EditProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get websiteInput(): Locator {
    return this.byTestId('profile-website').or(this.page.locator('#website')).or(this.page.getByLabel(/website/i)).first();
  }

  get saveButton(): Locator {
    return this.byTestId('profile-save').or(this.page.getByRole('button', { name: /save changes/i })).first();
  }

  async gotoEditProfile(): Promise<void> {
    await this.goto(routes.settingsProfile);
    await expect(this.saveButton).toBeVisible();
  }

  async setWebsiteUrl(value: string): Promise<void> {
    await this.websiteInput.fill(value);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async expectInvalidWebsiteValidation(): Promise<void> {
    await expect(this.page.getByText(/website.*valid|invalid website|valid url|url is invalid/i).first()).toBeVisible();
  }
}
