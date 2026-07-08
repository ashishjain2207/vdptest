import { expect, type Locator, type Page } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly countryInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.countryInput = page.getByTestId('onboarding-home-country-input');
    this.continueButton = page.getByTestId('onboarding-continue-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
    await expect(this.page.getByTestId('onboarding-page')).toBeVisible();
  }

  async completeHomeCountryStep(countryLabel: string): Promise<void> {
    await this.countryInput.click();
    await this.countryInput.fill(countryLabel);
    await this.page.getByRole('option', { name: new RegExp(countryLabel, 'i') }).click();
    await this.continueButton.click();
  }

  async skipProfilePictureStepIfPresent(): Promise<void> {
    await this.maybeClickButton(/skip/i);
  }

  async skipBioStepIfPresent(): Promise<void> {
    await this.maybeClickButton(/skip/i);
  }

  async skipInterestsStepIfPresent(): Promise<void> {
    await this.maybeClickButton(/skip/i);
  }

  async skipSuggestedUsersStepIfPresent(): Promise<void> {
    await this.maybeClickButton(/skip|finish|continue/i);
  }

  private async maybeClickButton(name: RegExp): Promise<void> {
    const button = this.page.getByRole('button', { name }).first();
    if (await button.count()) {
      await button.click();
    }
  }
}
