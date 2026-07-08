import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email').or(page.getByLabel(/email|username/i)).or(page.locator('#email')).first();
    this.passwordInput = page.getByTestId('login-password').or(page.getByLabel(/password/i)).or(page.locator('#password')).first();
    this.submitButton = page.getByTestId('login-submit').or(page.getByRole('button', { name: /log in|login|sign in/i })).first();
    this.errorMessage = page
      .getByTestId('login-error')
      .or(page.getByRole('alert'))
      .or(page.locator('[aria-invalid="true"], .text-destructive'))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(emailOrUsername: string, password: string): Promise<void> {
    await this.emailInput.fill(emailOrUsername);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectSuccessfulLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(posts|onboarding|admin|settings|profile|$)/);
    await expect(this.errorMessage).toBeHidden();
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(/invalid|failed|incorrect|password|credentials|required/i);
  }
}
