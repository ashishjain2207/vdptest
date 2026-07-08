import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type RegistrationInput = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  homeCountry?: string;
  acceptTerms?: boolean;
};

export class RegistrationPage extends BasePage {
  async goTo(): Promise<void> {
    await this.goto('/signup');
  }

  async enterFullName(fullName: string): Promise<void> {
    await this.field('name', [/full name/i, /display name/i, /name/i]).fill(fullName);
  }

  async enterUsername(username: string): Promise<void> {
    await this.field('username', [/username/i, /handle/i]).fill(username);
  }

  async enterEmail(email: string): Promise<void> {
    await this.field('email', [/email/i, /work email/i]).fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.field('password', [/password/i]).fill(password);
  }

  async confirmPassword(password: string): Promise<void> {
    await this.fillIfPresent(
      this.field('confirm-password', [/confirm password/i, /password confirmation/i]),
      password,
    );
  }

  async enterDateOfBirth(dateOfBirth: string): Promise<void> {
    await this.fillIfPresent(
      this.field('date-of-birth', [/date of birth/i, /birthday/i, /dob/i]),
      dateOfBirth,
    );
  }

  async selectHomeCountry(homeCountry: string): Promise<void> {
    const country = this.field('signup-home-country', [/home country/i, /country/i, /market/i]);
    if ((await country.count()) > 0 && await country.isVisible().catch(() => false)) {
      await country.fill(homeCountry);
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
  }

  async acceptTerms(): Promise<void> {
    const terms = this.locatorAny(
      this.page.getByTestId('terms-checkbox'),
      this.page.getByRole('checkbox', { name: /terms|conditions|privacy/i }),
    );

    if ((await terms.count()) > 0 && await terms.isVisible().catch(() => false)) {
      await terms.check();
    }
  }

  async submit(): Promise<void> {
    await this.byTestIdOrRole('registration-submit', 'button', /create account|sign up|register/i).click();
  }

  async completeRegistration(input: RegistrationInput): Promise<void> {
    await this.enterFullName(input.fullName);
    await this.enterUsername(input.username);
    await this.enterEmail(input.email);
    if (input.homeCountry) {
      await this.selectHomeCountry(input.homeCountry);
    }
    await this.enterPassword(input.password);
    await this.confirmPassword(input.confirmPassword ?? input.password);
    if (input.dateOfBirth) {
      await this.enterDateOfBirth(input.dateOfBirth);
    }
    if (input.acceptTerms ?? true) {
      await this.acceptTerms();
    }
    await this.submit();
  }

  async expectSuccessfulRegistration(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(onboarding|posts|login)(?:\?|$)/);
    await this.expectNoValidationErrors();
  }

  async expectRequiredFieldValidation(): Promise<void> {
    await expect(
      this.locatorAny(
        this.page.locator('[aria-invalid="true"]'),
        this.page.getByText(/required|please enter|please select|field is required/i),
      ).first(),
    ).toBeVisible();
    await expect(this.page).toHaveURL(/\/signup/);
  }

  async expectDuplicateUsernameError(): Promise<void> {
    await this.expectToastOrInlineMessage(/username.*(taken|exists|already)|already.*username/i);
    await expect(this.page).toHaveURL(/\/signup/);
  }
}
