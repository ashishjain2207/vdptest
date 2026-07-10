import { expect, type Page } from '@playwright/test';
import { clickFirst } from '../utils/locators';

export class OnboardingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
  }

  async skipOptionalSteps(): Promise<void> {
    for (let i = 0; i < 6; i += 1) {
      const skipButton = this.page.getByRole('button', { name: /skip|skip for now|next later/i }).first();
      if (await skipButton.count()) {
        await skipButton.click();
      } else {
        break;
      }
    }
  }

  async completeOnboarding(): Promise<void> {
    const completeButton = this.page.getByRole('button', { name: /finish|complete|continue|get started/i }).first();
    if (await completeButton.count()) {
      await completeButton.click();
      return;
    }
    await clickFirst(this.page, ['[data-testid="onboarding-complete"]', '[data-testid="onboarding-finish"]']);
  }

  async uploadInvalidProfilePicture(): Promise<void> {
    const input = this.page
      .locator('[data-testid="onboarding-profile-picture-upload"], input[type="file"][name*="profile"], input[type="file"]')
      .first();
    await input.setInputFiles({
      name: 'invalid-profile.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('binary payload'),
    });
  }

  async expectUploadError(): Promise<void> {
    await expect(this.page.getByText(/unsupported|invalid|file type|format/i)).toBeVisible();
  }
}
