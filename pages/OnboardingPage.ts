import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OnboardingPage extends BasePage {
  readonly skipButton: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.skipButton = this.byTestIdOr('onboarding-skip-button', page.getByRole('button', { name: /skip/i }).first());
    this.continueButton = this.byTestIdOr('onboarding-continue-button', page.getByRole('button', { name: /continue|next/i }).first());
    this.finishButton = this.byTestIdOr('onboarding-finish-button', page.getByRole('button', { name: /finish|complete|get started/i }).first());
  }

  async open(): Promise<void> {
    await this.goto('/onboarding');
  }

  async skipOptionalSteps(): Promise<void> {
    while (await this.skipButton.isVisible().catch(() => false)) {
      await this.skipButton.click();
    }
  }

  async complete(): Promise<void> {
    if (await this.finishButton.isVisible().catch(() => false)) {
      await this.finishButton.click();
    } else {
      await this.continueButton.click();
    }
    await expect(this.page).toHaveURL(/\/posts(?:\/|\?|$)/);
  }
}
