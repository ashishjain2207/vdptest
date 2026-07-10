import { expect, type Page } from '@playwright/test';
import { checkFirst, clickFirst, fillFirst } from '../utils/locators';

export interface RegistrationData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
}

export class RegistrationPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/signup');
  }

  async fillForm(data: RegistrationData): Promise<void> {
    await fillFirst(
      this.page,
      ['[data-testid="registration-full-name"]', '[data-testid="signup-full-name"]', 'input[name="fullName"]', '#fullName'],
      data.fullName,
    );
    await fillFirst(
      this.page,
      ['[data-testid="registration-username"]', '[data-testid="signup-username"]', 'input[name="username"]', '#username'],
      data.username,
    );
    await fillFirst(this.page, ['[data-testid="registration-email"]', '[data-testid="signup-email"]', 'input[name="email"]', '#email'], data.email);
    await fillFirst(this.page, ['[data-testid="registration-password"]', '[data-testid="signup-password"]', 'input[name="password"]', '#password'], data.password);
    await fillFirst(
      this.page,
      [
        '[data-testid="registration-confirm-password"]',
        '[data-testid="signup-confirm-password"]',
        'input[name="confirmPassword"]',
        '#confirmPassword',
      ],
      data.confirmPassword,
    );
    await fillFirst(
      this.page,
      ['[data-testid="registration-date-of-birth"]', '[data-testid="signup-dob"]', 'input[name="dateOfBirth"]', 'input[type="date"]'],
      data.dateOfBirth,
    );
  }

  async acceptTerms(): Promise<void> {
    await checkFirst(
      this.page,
      ['[data-testid="registration-terms"]', '[data-testid="signup-terms"]', 'input[type="checkbox"][name*="terms"]', 'input[type="checkbox"]'],
    );
  }

  async submit(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /register|sign up|create account/i }).first();
    if (await submitButton.count()) {
      await submitButton.click();
      return;
    }
    await clickFirst(this.page, ['[data-testid="registration-submit"]', '[data-testid="signup-submit"]', 'button[type="submit"]']);
  }

  async expectRegistrationSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(onboarding|posts|profile\/.+)/);
    await expect(this.page.locator('[data-testid="registration-error"], [role="alert"]')).toHaveCount(0);
  }

  async expectDuplicateUsernameError(): Promise<void> {
    const error = this.page
      .locator('[data-testid="username-error"], [data-testid="registration-error"], [role="alert"]')
      .filter({ hasText: /username|taken|already exists|already in use/i })
      .first();
    if (await error.count()) {
      await expect(error).toBeVisible();
    } else {
      await expect(this.page.getByText(/username|taken|already exists|already in use/i)).toBeVisible();
    }
    await expect(this.page).toHaveURL(/\/signup(?:\?.*)?$/);
  }
}
