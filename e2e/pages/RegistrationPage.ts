import { expect, type Locator, type Page } from '@playwright/test';

export interface RegistrationRequiredInput {
  name: string;
  username: string;
  homeCountry: string;
  email: string;
  password: string;
}

export class RegistrationPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly homeCountryInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#name');
    this.usernameInput = page.locator('#username');
    this.homeCountryInput = page.locator('#signup-home-country');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('form button[type="submit"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/signup');
    await expect(this.nameInput).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.homeCountryInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async fillRequiredValues(data: RegistrationRequiredInput): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.usernameInput.fill(data.username);
    await this.homeCountryInput.fill(data.homeCountry);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
