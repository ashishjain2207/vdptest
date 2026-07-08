import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly root: Locator;
  readonly form: Locator;
  readonly error: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('login-page');
    this.form = page.getByTestId('login-form');
    this.error = page.getByTestId('login-error');
    this.submitButton = page.getByTestId('login-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.form).toBeVisible();
  }

  async fillEmail(value: string): Promise<void> {
    await this.page.locator('#email').fill(value);
  }

  async fillPassword(value: string): Promise<void> {
    await this.page.locator('#password').fill(value);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillEmail(username);
    await this.fillPassword(password);
    await this.submit();
  }
}
