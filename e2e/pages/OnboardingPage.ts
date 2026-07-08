import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly root: Locator;
  readonly form: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('onboarding-page');
    this.form = page.getByTestId('onboarding-home-country-form');
    this.continueButton = page.getByTestId('onboarding-continue');
  }

  async goto(returnUrl = '/posts'): Promise<void> {
    await this.page.goto(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.form).toBeVisible();
  }

  async selectHomeCountry(countryCode: string): Promise<void> {
    const input = this.page.locator('#onboarding-home-country-required');
    await input.click();
    await input.fill(countryCode);
    await input.press('Enter');
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }
}
