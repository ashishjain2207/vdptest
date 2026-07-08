import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorAlert = page.locator('[role="alert"], text=/invalid|required|suspended/i').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.getByTestId('login-page')).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/u);
    await expect(this.page.getByTestId('login-page')).toBeVisible();
  }
}
