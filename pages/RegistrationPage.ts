import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type RegistrationInput = {
  displayName: string;
  username: string;
  email: string;
  homeCountry: string;
  password: string;
};

export class RegistrationPage extends BasePage {
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly homeCountryInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.byTestIdOr('registration-name-input', page.locator('#name'));
    this.usernameInput = this.byTestIdOr('registration-username-input', page.locator('#username'));
    this.emailInput = this.byTestIdOr('registration-email-input', page.locator('#email'));
    this.homeCountryInput = this.byTestIdOr('registration-home-country-input', page.locator('#signup-home-country'));
    this.passwordInput = this.byTestIdOr('registration-password-input', page.locator('#password'));
    this.submitButton = this.byTestIdOr(
      'registration-submit-button',
      page.getByRole('button', { name: /sign up|create account|registrieren/i }),
    );
  }

  async open(): Promise<void> {
    await this.goto('/signup');
  }

  async fillForm(input: RegistrationInput): Promise<void> {
    await this.nameInput.fill(input.displayName);
    await this.usernameInput.fill(input.username);
    await this.emailInput.fill(input.email);
    await this.homeCountryInput.fill(input.homeCountry);
    await this.passwordInput.fill(input.password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async register(input: RegistrationInput): Promise<void> {
    await this.open();
    await this.fillForm(input);
    await this.submit();
  }

  async expectSuccessfulRegistration(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await this.expectToast(/account created|check your email|created/i);
  }

  async expectMissingRequiredFields(): Promise<void> {
    await expect(this.page.locator('#signup-name-err, #signup-username-err, #signup-home-country-err, #signup-email-err, #signup-password-err')).toHaveCount(5);
  }

  async expectDuplicateUsernameError(): Promise<void> {
    await expect(
      this.page
        .locator('#signup-username-err')
        .or(this.page.getByText(/username.*taken|handle.*taken|already exists/i))
        .first(),
    ).toBeVisible();
  }
}
