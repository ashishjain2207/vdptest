import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get emailInput(): Locator {
    return this.byTestId('login-email').or(this.page.locator('#email')).or(this.page.getByLabel(/email/i)).first();
  }

  get passwordInput(): Locator {
    return this.byTestId('login-password').or(this.page.locator('#password')).first();
  }

  get submitButton(): Locator {
    return this.byTestId('login-submit').or(this.page.getByRole('button', { name: /^sign in$/i })).first();
  }

  async gotoLogin(returnUrl?: string): Promise<void> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    await this.goto(`${routes.login}${query}`);
    await expect(this.submitButton).toBeVisible();
  }

  async login(email: string, password: string, returnUrl?: string): Promise<void> {
    await this.gotoLogin(returnUrl);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectInvalidLoginError(): Promise<void> {
    await expect(this.page.getByText(/invalid username or password|invalid credentials|sign in failed|login failed/i).first()).toBeVisible();
  }

  async expectLoginPage(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
    await expect(this.page).toHaveURL(/\/login/i);
  }

  async expectSuccessfulLoginRedirect(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts|\/onboarding|\/support\/inbox|\/admin/i);
  }
}
