import { expect, type Locator, type Page } from '@playwright/test';

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export class LoginPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  emailField(): Locator {
    return this.first(
      this.page.getByTestId('login-email'),
      this.page.locator('#email'),
      this.page.getByLabel(/email/i),
    );
  }

  passwordField(): Locator {
    return this.first(
      this.page.getByTestId('login-password'),
      this.page.locator('#password'),
      this.page.getByLabel(/^password$/i),
    );
  }

  submitButton(): Locator {
    return this.first(
      this.page.getByTestId('login-submit'),
      this.page.getByRole('button', { name: /sign in|login/i }),
    );
  }

  errorMessage(): Locator {
    return this.first(
      this.page.getByTestId('login-error'),
      this.page.getByText(/invalid|failed|suspended|not verified|error/i),
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.submitButton()).toBeVisible();
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await this.emailField().fill(credentials.usernameOrEmail);
    await this.passwordField().fill(credentials.password);
    await this.submitButton().click();
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await expect(this.submitButton()).toBeVisible();
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(posts|onboarding)(?:\?|$)/);
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.errorMessage()).toBeVisible();
  }
}
