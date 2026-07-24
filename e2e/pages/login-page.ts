import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  private get emailInput() {
    return this.page.locator('#email');
  }

  private get passwordInput() {
    return this.page.locator('#password');
  }

  private get signInButton() {
    return this.page.getByRole('button', { name: /sign in/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
