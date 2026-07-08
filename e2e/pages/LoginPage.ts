import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type LoginCredentials = {
  email: string;
  password: string;
};

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoLogin(returnUrl?: string): Promise<void> {
    await this.goto(returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login');
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.fillInput(/email/i, credentials.email);
    await this.fillInput(/password/i, credentials.password);
    await this.clickButton(/sign in|login/i);
  }

  async loginSuccessfully(credentials: LoginCredentials): Promise<void> {
    await this.login(credentials);
    await expect(this.page).not.toHaveURL(/\/login(?:\?|$)/);
    await expect(this.page).toHaveURL(/\/(posts|onboarding|maintenance)/);
  }

  async expectInvalidLogin(): Promise<void> {
    await this.expectToastOrInlineMessage(/invalid|failed|incorrect|not verified|suspended|unauthorized/i);
    await expect(this.page).toHaveURL(/\/login/);
  }
}
