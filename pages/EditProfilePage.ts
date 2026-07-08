import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EditProfilePage extends BasePage {
  readonly websiteInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.websiteInput = this.byTestIdOr(
      'profile-website-input',
      page.getByLabel(/website/i).or(page.getByPlaceholder(/website/i)).first(),
    );
    this.saveButton = this.byTestIdOr('profile-save-button', page.getByRole('button', { name: /save|update/i }).first());
  }

  async open(): Promise<void> {
    await this.goto('/settings/profile');
  }

  async setWebsiteUrl(url: string): Promise<void> {
    await this.websiteInput.fill(url);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async expectInvalidWebsiteValidation(): Promise<void> {
    await expect(
      this.page
        .getByRole('alert')
        .or(this.page.getByText(/invalid.*website|valid url|website url/i))
        .first(),
    ).toBeVisible();
  }
}
