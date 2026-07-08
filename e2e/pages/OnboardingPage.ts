import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OnboardingPage extends BasePage {
  async goTo(): Promise<void> {
    await this.goto('/onboarding');
    await expect(this.page).toHaveURL(/\/onboarding/);
  }

  async skipProfilePicture(): Promise<void> {
    await this.clickIfPresent(this.byTestIdOrRole('skip-profile-picture', 'button', /skip.*picture|skip/i));
  }

  async skipBio(): Promise<void> {
    await this.clickIfPresent(this.byTestIdOrRole('skip-bio', 'button', /skip.*bio|skip/i));
  }

  async skipInterests(): Promise<void> {
    await this.clickIfPresent(this.byTestIdOrRole('skip-interests', 'button', /skip.*interest|skip/i));
  }

  async skipSuggestedUsers(): Promise<void> {
    await this.clickIfPresent(this.byTestIdOrRole('skip-suggested-users', 'button', /skip.*user|skip/i));
  }

  async complete(): Promise<void> {
    const completeButton = this.locatorAny(
      this.page.getByTestId('complete-onboarding'),
      this.page.getByRole('button', { name: /complete|continue|finish|save/i }),
    );
    await completeButton.click();
  }

  async completeWithOptionalStepsSkipped(): Promise<void> {
    await this.skipProfilePicture();
    await this.skipBio();
    await this.skipInterests();
    await this.skipSuggestedUsers();
    await this.complete();
  }

  async expectCompleted(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts|\/$/);
  }
}
