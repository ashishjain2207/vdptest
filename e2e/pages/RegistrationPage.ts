import { expect, Locator, Page } from '@playwright/test';

type RegistrationFormData = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
};

export class RegistrationPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly dateOfBirthInput: Locator;
  readonly termsCheckbox: Locator;
  readonly registerButton: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page
      .getByTestId('registration-full-name')
      .or(page.getByLabel(/full name|name/i))
      .or(page.getByPlaceholder(/full name|name/i))
      .first();
    this.usernameInput = page
      .getByTestId('registration-username')
      .or(page.getByLabel(/username/i))
      .or(page.getByPlaceholder(/username/i))
      .first();
    this.emailInput = page
      .getByTestId('registration-email')
      .or(page.getByLabel(/email/i))
      .or(page.getByPlaceholder(/email/i))
      .first();
    this.passwordInput = page
      .getByTestId('registration-password')
      .or(page.getByLabel(/^password$/i))
      .or(page.getByPlaceholder(/^password$/i))
      .first();
    this.confirmPasswordInput = page
      .getByTestId('registration-confirm-password')
      .or(page.getByLabel(/confirm password|repeat password/i))
      .or(page.getByPlaceholder(/confirm password|repeat password/i))
      .first();
    this.dateOfBirthInput = page
      .getByTestId('registration-date-of-birth')
      .or(page.getByLabel(/date of birth|birth date|dob/i))
      .first();
    this.termsCheckbox = page
      .getByTestId('registration-terms')
      .or(page.getByRole('checkbox', { name: /terms|conditions/i }))
      .first();
    this.registerButton = page
      .getByTestId('registration-submit')
      .or(page.getByRole('button', { name: /register|sign up|create account/i }))
      .first();
    this.validationErrors = page
      .getByTestId('registration-error')
      .or(page.getByRole('alert'))
      .or(page.getByText(/already taken|validation|invalid|required/i));
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup');
  }

  async register(data: RegistrationFormData): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
    await this.dateOfBirthInput.fill(data.dateOfBirth);
    await this.termsCheckbox.check();
    await this.registerButton.click();
  }

  async expectRegistrationSucceeded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/onboarding|\/posts|\/verify-email/);
  }

  async expectNoValidationErrors(): Promise<void> {
    await expect(this.validationErrors.first()).toBeHidden();
  }

  async expectDuplicateUsernameError(): Promise<void> {
    await expect(this.validationErrors.filter({ hasText: /username|already taken|exists/i }).first()).toBeVisible();
  }

  async expectOnRegistrationPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/signup/);
  }
}
