import { expect, type Page } from '@playwright/test';
import { clickFirst, fillFirst } from '../utils/locators';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async fillEmail(emailOrUsername: string): Promise<void> {
    await fillFirst(this.page, ['#email', '[data-testid="login-email"]', 'input[name="email"]'], emailOrUsername);
  }

  async fillPassword(password: string): Promise<void> {
    await fillFirst(this.page, ['#password', '[data-testid="login-password"]', 'input[name="password"]'], password);
  }

  async submit(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /sign in|login/i }).first();
    if (await submitButton.count()) {
      await submitButton.click();
      return;
    }
    await clickFirst(this.page, ['[data-testid="login-submit"]', 'button[type="submit"]']);
  }

  async login(emailOrUsername: string, password: string): Promise<void> {
    await this.fillEmail(emailOrUsername);
    await this.fillPassword(password);
    await this.submit();
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(this.page.locator('#email')).toBeVisible();
    await expect(this.page.locator('#password')).toBeVisible();
  }

  async expectInvalidCredentialsError(): Promise<void> {
    const explicitError = this.page
      .locator('[data-testid="login-error"], [role="alert"], .text-red-800, .text-destructive')
      .first();
    if (await explicitError.count()) {
      await expect(explicitError).toBeVisible();
      return;
    }

    await expect(this.page.getByText(/invalid|incorrect|failed|credentials|password/i)).toBeVisible();
  }
}
