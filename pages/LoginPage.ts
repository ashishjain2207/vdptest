import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.byTestIdOr('login-email-input', page.locator('#email'));
    this.passwordInput = this.byTestIdOr('login-password-input', page.locator('#password'));
    this.submitButton = this.byTestIdOr(
      'login-submit-button',
      page.getByRole('button', { name: /sign in|log in|login|anmelden/i }),
    );
  }

  async open(returnUrl?: string): Promise<void> {
    await this.goto(returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login');
  }

  async login(email: string, password: string, returnUrl?: string): Promise<void> {
    await this.open(returnUrl);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectInvalidLoginError(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(
      this.page
        .getByRole('alert')
        .or(this.page.getByText(/invalid|incorrect|failed|not verified|suspended/i))
        .first(),
    ).toBeVisible();
  }

  async expectAuthenticatedRedirect(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(posts|onboarding|maintenance)(?:\/|\?|$)/);
  }

  async expectLoginPage(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }
}
