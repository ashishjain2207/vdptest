import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  async goTo(returnUrl?: string): Promise<void> {
    await this.goto(returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login');
  }

  async enterIdentifier(identifier: string): Promise<void> {
    await this.field('email', [/email/i, /username/i]).fill(identifier);
  }

  async enterPassword(password: string): Promise<void> {
    await this.field('password', [/password/i]).fill(password);
  }

  async submit(): Promise<void> {
    await this.byTestIdOrRole('login-submit', 'button', /sign in|log in|login/i).click();
  }

  async signIn(identifier: string, password: string): Promise<void> {
    await this.goTo();
    await this.enterIdentifier(identifier);
    await this.enterPassword(password);
    await this.submit();
  }

  async expectInvalidCredentials(): Promise<void> {
    await this.expectToastOrInlineMessage(/invalid|incorrect|failed|not found|unauthorized/i);
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectLoginPage(): Promise<void> {
    await expect(this.field('email', [/email/i, /username/i])).toBeVisible();
    await expect(this.byTestIdOrRole('login-submit', 'button', /sign in|log in|login/i)).toBeVisible();
  }
}
