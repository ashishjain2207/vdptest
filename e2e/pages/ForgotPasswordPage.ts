import { expect, type Locator, type Page } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly successParagraph: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.submitButton = page.locator('form button[type="submit"]');
    this.successParagraph = page
      .locator('p')
      .filter({ hasText: /if an account exists with that email|falls ein konto mit dieser e-mail existiert/i })
      .first();
  }

  async open(): Promise<void> {
    await this.page.goto('/forgot-password');
    await expect(this.emailInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectSuccessState(): Promise<void> {
    await expect(this.emailInput).toHaveCount(0);
    await expect(this.successParagraph).toBeVisible();
  }

  async readSuccessMessage(): Promise<string> {
    await this.expectSuccessState();
    return (await this.successParagraph.textContent())?.trim() ?? '';
  }
}
