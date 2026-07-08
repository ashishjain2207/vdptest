import { expect, Locator, Page } from '@playwright/test';

import { LoginCredentials } from '../utils/env';

export class LoginPage {
  readonly page: Page;
  readonly identifierInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.identifierInput = page
      .getByTestId('login-identifier')
      .or(page.getByTestId('login-email'))
      .or(page.getByLabel(/email|username/i))
      .or(page.getByPlaceholder(/email|username/i))
      .first();
    this.passwordInput = page
      .getByTestId('login-password')
      .or(page.getByLabel(/password/i))
      .or(page.getByPlaceholder(/password/i))
      .first();
    this.submitButton = page
      .getByTestId('login-submit')
      .or(page.getByRole('button', { name: /^log ?in|sign ?in$/i }))
      .first();
    this.errorMessage = page
      .getByTestId('login-error')
      .or(page.getByRole('alert'))
      .or(page.getByText(/invalid credentials|invalid password|incorrect password|login failed/i))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async enterIdentifier(identifier: string): Promise<void> {
    await this.identifierInput.fill(identifier);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.goto();
    await this.enterIdentifier(credentials.identifier);
    await this.enterPassword(credentials.password);
    await this.submit();
  }

  async expectLoginSucceeded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts|\/onboarding|\/$/);
    await expect(this.errorMessage).toBeHidden();
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(/invalid|incorrect|failed/i);
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
