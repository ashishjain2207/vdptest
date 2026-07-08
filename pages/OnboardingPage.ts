import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class OnboardingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /complete your profile/i }).first();
  }

  get countryInput(): Locator {
    return this.byTestId('onboarding-country').or(this.page.locator('#onboarding-home-country-required')).or(this.page.getByLabel(/^country/i)).first();
  }

  get skipOptionalButton(): Locator {
    return this.byTestId('onboarding-skip').or(this.page.getByRole('button', { name: /skip|skip for now/i })).first();
  }

  get continueButton(): Locator {
    return this.byTestId('onboarding-continue').or(this.page.getByRole('button', { name: /continue/i })).first();
  }

  async gotoOnboarding(): Promise<void> {
    await this.goto(routes.onboarding);
    await expect(this.heading.or(this.continueButton)).toBeVisible();
  }

  async chooseCountry(country: string): Promise<void> {
    await expect(this.countryInput).toBeEnabled();
    await this.countryInput.click();
    await this.page.getByRole('option', { name: new RegExp(country, 'i') }).first().click();
  }

  async skipOptionalSteps(): Promise<void> {
    for (let step = 0; step < 5 && await this.skipOptionalButton.isVisible(); step += 1) {
      await this.skipOptionalButton.click();
    }
  }

  async complete(country: string): Promise<void> {
    await this.chooseCountry(country);
    await this.skipOptionalSteps();
    await this.continueButton.click();
  }

  async expectCompleted(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts/i);
  }
}
