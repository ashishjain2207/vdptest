import { expect, type Locator, type Page } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly countryInput: Locator;
  readonly combobox: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.countryInput = page.locator('#onboarding-home-country-required');
    this.combobox = page.getByRole('combobox');
    this.continueButton = page.locator('button[type="button"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/onboarding');
  }

  async assertVisible(): Promise<void> {
    await expect(this.countryInput).toBeVisible();
    await expect(this.combobox).toBeVisible();
  }
}
