import { expect, type Locator, type Page } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly countryInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByTestId('registration-name-input');
    this.usernameInput = page.getByTestId('registration-username-input');
    this.countryInput = page.getByTestId('registration-country-input');
    this.emailInput = page.getByTestId('registration-email-input');
    this.passwordInput = page.getByTestId('registration-password-input');
    this.submitButton = page.getByTestId('registration-submit-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await expect(this.page.getByTestId('registration-page')).toBeVisible();
  }

  async fillRegistrationForm(data: {
    fullName: string;
    username: string;
    homeCountry: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.nameInput.fill(data.fullName);
    await this.usernameInput.fill(data.username);
    await this.countryInput.click();
    await this.countryInput.fill(data.homeCountry);
    await this.page.getByRole('option', { name: new RegExp(data.homeCountry, 'i') }).click();
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  usernameTakenMessage(): Locator {
    return this.page.locator('text=/username.*taken|already exists|already taken/i').first();
  }
}
