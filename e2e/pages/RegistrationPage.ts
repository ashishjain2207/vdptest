import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface RegistrationFormData {
  name: string;
  handle: string;
  email: string;
  password: string;
  homeCountry: string;
}

export class RegistrationPage {
  readonly page: Page;
  readonly root: Locator;
  readonly form: Locator;
  readonly usernameError: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('registration-page');
    this.form = page.getByTestId('registration-form');
    this.usernameError = page.getByTestId('registration-username-error');
    this.submitButton = page.getByTestId('registration-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup', { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.form).toBeVisible();
  }

  async selectHomeCountry(countryCode: string): Promise<void> {
    const input = this.page.locator('#signup-home-country');
    await input.click();
    await input.fill(countryCode);
    await input.press('Enter');
  }

  async fillForm(data: RegistrationFormData): Promise<void> {
    await this.page.locator('#name').fill(data.name);
    await this.page.locator('#username').fill(data.handle);
    await this.selectHomeCountry(data.homeCountry);
    await this.page.locator('#email').fill(data.email);
    await this.page.locator('#password').fill(data.password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
