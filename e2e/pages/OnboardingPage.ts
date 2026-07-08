import { expect, Locator, Page } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly profilePictureInput: Locator;
  readonly skipButton: Locator;
  readonly completeButton: Locator;
  readonly uploadError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profilePictureInput = page
      .getByTestId('onboarding-profile-picture-input')
      .or(page.locator('input[type="file"][name*="profile" i]'))
      .or(page.locator('input[type="file"]').first());
    this.skipButton = page
      .getByTestId('onboarding-skip')
      .or(page.getByRole('button', { name: /skip|not now/i }))
      .first();
    this.completeButton = page
      .getByTestId('onboarding-complete')
      .or(page.getByRole('button', { name: /complete|finish|continue to feed|done/i }))
      .first();
    this.uploadError = page
      .getByTestId('onboarding-upload-error')
      .or(page.getByRole('alert'))
      .or(page.getByText(/unsupported|file type|invalid format/i))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
  }

  async skipOptionalStep(): Promise<void> {
    await this.skipButton.click();
  }

  async completeWithOptionalStepsSkipped(): Promise<void> {
    for (let i = 0; i < 4; i += 1) {
      await this.skipOptionalStep();
    }

    await this.completeButton.click();
  }

  async uploadInvalidProfilePicture(path: string): Promise<void> {
    await this.profilePictureInput.setInputFiles(path);
  }

  async expectCompletedToHomeFeed(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts|\/$/);
  }

  async expectUnsupportedProfilePictureError(): Promise<void> {
    await expect(this.uploadError).toBeVisible();
    await expect(this.uploadError).toContainText(/unsupported|file type|format|invalid/i);
  }
}
