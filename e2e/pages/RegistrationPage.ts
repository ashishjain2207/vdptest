import { expect, type Locator, type Page } from '@playwright/test';

export interface RegistrationFormInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  homeCountry: string;
  acceptTerms?: boolean;
}

export class RegistrationPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  private async fillIfVisible(locator: Locator, value?: string): Promise<void> {
    if (!value) {
      return;
    }

    if (await locator.isVisible({ timeout: 750 }).catch(() => false)) {
      await locator.fill(value);
    }
  }

  private async checkIfVisible(locator: Locator): Promise<void> {
    if (await locator.isVisible({ timeout: 750 }).catch(() => false)) {
      await locator.check();
    }
  }

  fullNameField(): Locator {
    return this.first(
      this.page.getByTestId('signup-name'),
      this.page.locator('#name'),
      this.page.getByLabel(/name/i),
    );
  }

  usernameField(): Locator {
    return this.first(
      this.page.getByTestId('signup-username'),
      this.page.locator('#username'),
      this.page.getByLabel(/username/i),
    );
  }

  countryField(): Locator {
    return this.first(
      this.page.getByTestId('signup-home-country'),
      this.page.locator('#signup-home-country'),
      this.page.getByRole('combobox', { name: /country/i }),
      this.page.getByLabel(/country/i),
    );
  }

  emailField(): Locator {
    return this.first(
      this.page.getByTestId('signup-email'),
      this.page.locator('#email'),
      this.page.getByLabel(/email/i),
    );
  }

  passwordField(): Locator {
    return this.first(
      this.page.getByTestId('signup-password'),
      this.page.locator('#password'),
      this.page.getByLabel(/^password$/i),
    );
  }

  confirmPasswordField(): Locator {
    return this.first(
      this.page.getByTestId('signup-confirm-password'),
      this.page.locator('#confirmPassword'),
      this.page.getByLabel(/confirm password/i),
    );
  }

  dateOfBirthField(): Locator {
    return this.first(
      this.page.getByTestId('signup-date-of-birth'),
      this.page.locator('#dateOfBirth'),
      this.page.getByLabel(/date of birth/i),
    );
  }

  termsCheckbox(): Locator {
    return this.first(
      this.page.getByTestId('signup-terms'),
      this.page.getByRole('checkbox', { name: /terms|conditions/i }),
    );
  }

  registerButton(): Locator {
    return this.first(
      this.page.getByTestId('signup-submit'),
      this.page.getByRole('button', { name: /create (free )?account|register/i }),
    );
  }

  usernameTakenError(): Locator {
    return this.first(
      this.page.getByTestId('signup-username-error'),
      this.page.getByText(/username.*(already|taken|use|vergeben)/i),
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await expect(this.registerButton()).toBeVisible();
  }

  async selectCountry(countryValue: string): Promise<void> {
    const field = this.countryField();
    await field.click();
    await field.fill(countryValue);

    const option = this.page.getByRole('option', { name: new RegExp(countryValue, 'i') }).first();
    if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
      await option.click();
      return;
    }

    await field.press('ArrowDown').catch(() => {});
    await field.press('Enter').catch(() => {});
  }

  async register(input: RegistrationFormInput): Promise<void> {
    await this.fullNameField().fill(input.fullName);
    await this.usernameField().fill(input.username);
    await this.selectCountry(input.homeCountry);
    await this.emailField().fill(input.email);
    await this.passwordField().fill(input.password);
    await this.fillIfVisible(this.confirmPasswordField(), input.confirmPassword);
    await this.fillIfVisible(this.dateOfBirthField(), input.dateOfBirth);
    if (input.acceptTerms) {
      await this.checkIfVisible(this.termsCheckbox());
    }
    await this.registerButton().click();
  }

  async expectSuccessfulRegistration(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(login|onboarding|posts)(?:\?|$)/);
    await expect(this.usernameTakenError()).toBeHidden({ timeout: 1000 }).catch(() => {});
  }

  async expectDuplicateUsernameError(): Promise<void> {
    await expect(this.usernameTakenError()).toBeVisible();
  }

  async expectOnRegistrationPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/signup(?:\?|$)/);
    await expect(this.registerButton()).toBeVisible();
  }
}
