import { expect, type Locator, type Page } from '@playwright/test';

export interface RegistrationRequiredInput {
  name: string;
  username: string;
  homeCountry: string;
  email: string;
  password: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class RegistrationPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly homeCountryInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly nameError: Locator;
  readonly usernameError: Locator;
  readonly homeCountryError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#name');
    this.usernameInput = page.locator('#username');
    this.homeCountryInput = page.locator('#signup-home-country');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('form button[type="submit"]');
    this.nameError = page.locator('#signup-name-err');
    this.usernameError = page.locator('#signup-username-err');
    this.homeCountryError = page.locator('#signup-home-country-err');
    this.emailError = page.locator('#signup-email-err');
    this.passwordError = page.locator('#signup-password-err');
  }

  async open(): Promise<void> {
    await this.page.goto('/signup');
    await expect(this.nameInput).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.homeCountryInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillRequiredValues(data: RegistrationRequiredInput): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.usernameInput.fill(data.username);
    await this.selectHomeCountry(data.homeCountry);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }

  async selectHomeCountry(label: string): Promise<void> {
    const option = this.page.getByRole('option', {
      name: new RegExp(`^${escapeRegex(label)}$`, 'i'),
    });

    await this.homeCountryInput.click();
    await this.homeCountryInput.fill(label);
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.homeCountryInput).toHaveValue(new RegExp(`^${escapeRegex(label)}$`, 'i'));
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
