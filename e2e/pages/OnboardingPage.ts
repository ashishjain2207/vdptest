import { expect, type Locator, type Page } from '@playwright/test';

export class OnboardingPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  countryField(): Locator {
    return this.first(
      this.page.locator('#onboarding-home-country-required'),
      this.page.getByRole('combobox', { name: /country/i }),
      this.page.getByLabel(/home country|country/i),
    );
  }

  continueButton(): Locator {
    return this.first(
      this.page.getByTestId('onboarding-continue'),
      this.page.getByRole('button', { name: /continue|complete/i }),
    );
  }

  profilePictureInput(): Locator {
    return this.page.locator('input[type="file"]').first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/onboarding(?:\?|$)/);
    await expect(this.continueButton()).toBeVisible();
  }

  async skipOptionalStepIfVisible(label: RegExp): Promise<void> {
    const button = this.page.getByRole('button', { name: label }).first();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click();
    }
  }

  async selectCountry(countryValue: string): Promise<void> {
    const field = this.countryField();
    await field.click();
    await field.fill(countryValue);
    const option = this.page.getByRole('option', { name: new RegExp(countryValue, 'i') }).first();
    if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
      await option.click();
      return;
    }
    await field.press('ArrowDown').catch(() => {});
    await field.press('Enter').catch(() => {});
  }

  async completeOnboarding(countryValue = 'DE'): Promise<void> {
    await this.selectCountry(countryValue);
    await this.continueButton().click();
  }

  async hasProfilePictureUploadStep(): Promise<boolean> {
    return this.profilePictureInput().isVisible({ timeout: 1000 }).catch(() => false);
  }

  async uploadInvalidProfilePicture(filePath: string): Promise<void> {
    await this.profilePictureInput().setInputFiles(filePath);
  }

  async expectUploadError(): Promise<void> {
    await expect(this.page.getByText(/unsupported|select an image file|invalid/i)).toBeVisible();
  }
}
