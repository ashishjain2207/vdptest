import { expect, type Locator, type Page } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly container: Locator;
  readonly skipButton: Locator;
  readonly completeButton: Locator;
  readonly profilePictureInput: Locator;
  readonly validationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('onboarding').or(page.locator('main')).first();
    this.skipButton = page.getByTestId('onboarding-skip').or(page.getByRole('button', { name: /skip/i })).first();
    this.completeButton = page.getByTestId('onboarding-complete').or(page.getByRole('button', { name: /complete|finish|continue|save/i })).last();
    this.profilePictureInput = page.getByTestId('onboarding-profile-picture').or(page.getByLabel(/profile picture|avatar|photo/i)).or(page.locator('input[type="file"]')).first();
    this.validationMessage = page.getByRole('alert').or(page.locator('.text-destructive, [data-sonner-toast]')).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
    await expect(this.container).toBeVisible();
  }

  async skipOptionalSteps(): Promise<void> {
    for (let index = 0; index < 4; index += 1) {
      if (await this.skipButton.count() === 0 || !await this.skipButton.isVisible()) {
        break;
      }
      await this.skipButton.click();
    }
  }

  async complete(): Promise<void> {
    if (await this.completeButton.count() > 0 && await this.completeButton.isVisible()) {
      await this.completeButton.click();
    }
  }

  async expectCompleted(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(posts|profile|settings|$)/);
  }

  async uploadInvalidProfilePicture(filePath: string): Promise<void> {
    await expect(this.profilePictureInput).toBeVisible();
    await this.profilePictureInput.setInputFiles(filePath);
  }

  async expectInvalidProfilePictureError(expectedMessage?: string): Promise<void> {
    await expect(this.validationMessage).toBeVisible();
    await expect(this.validationMessage).toContainText(new RegExp(expectedMessage ?? 'unsupported|file type|format|image', 'i'));
  }
}
