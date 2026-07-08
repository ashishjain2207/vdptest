import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export type RegistrationInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  country?: string;
};

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get nameInput(): Locator {
    return this.byTestId('registration-name').or(this.page.locator('#name')).or(this.page.getByLabel(/^name/i)).first();
  }

  get usernameInput(): Locator {
    return this.byTestId('registration-username').or(this.page.locator('#username')).or(this.page.getByLabel(/username/i)).first();
  }

  get emailInput(): Locator {
    return this.byTestId('registration-email').or(this.page.locator('#email')).or(this.page.getByLabel(/business email address|email/i)).first();
  }

  get passwordInput(): Locator {
    return this.byTestId('registration-password').or(this.page.locator('#password')).or(this.page.getByPlaceholder(/^create password$/i)).first();
  }

  get countryInput(): Locator {
    return this.byTestId('registration-country').or(this.page.locator('#signup-home-country')).or(this.page.getByLabel(/^country/i)).first();
  }

  get submitButton(): Locator {
    return this.byTestId('registration-submit').or(this.page.getByRole('button', { name: /create free account/i })).first();
  }

  async gotoRegistration(): Promise<void> {
    await this.goto(routes.signup);
    await expect(this.submitButton).toBeVisible();
  }

  async fillRegistration(input: RegistrationInput): Promise<void> {
    await this.nameInput.fill(input.name);
    await this.usernameInput.fill(input.username);
    await this.emailInput.fill(input.email);
    await this.passwordInput.fill(input.password);
    if (input.country) {
      await this.selectCountry(input.country);
    }
  }

  async selectCountry(country: string): Promise<void> {
    await expect(this.countryInput).toBeEnabled();
    await this.countryInput.click();
    await this.page.getByRole('option', { name: new RegExp(country, 'i') }).first().click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async registerValidUser(input: RegistrationInput): Promise<void> {
    await this.gotoRegistration();
    await this.fillRegistration(input);
    await this.submit();
  }

  async expectSuccessfulRegistration(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login|\/verify-email|\/onboarding/i);
  }

  async expectRequiredFieldErrors(): Promise<void> {
    await expect(this.page.getByText(/please enter your name|name is required|email is required|password is required/i).first()).toBeVisible();
  }

  async expectDuplicateUsernameError(): Promise<void> {
    await expect(this.page.getByText(/username.*(taken|already|exists|unavailable)|already.*username/i).first()).toBeVisible();
  }
}
