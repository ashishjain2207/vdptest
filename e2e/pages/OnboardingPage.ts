import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OnboardingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoOnboarding(returnUrl = '/posts'): Promise<void> {
    await this.goto(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  async skipOptionalStepsIfPresent(): Promise<void> {
    for (const label of [/skip/i, /not now/i, /later/i]) {
      const button = this.page.getByRole('button', { name: label }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click();
      }
    }
  }

  async completeHomeCountry(country: string): Promise<void> {
    await this.selectComboboxOption(/home country/i, country);
    await this.clickButton(/continue/i);
  }

  async expectCompleted(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts/);
  }
}
