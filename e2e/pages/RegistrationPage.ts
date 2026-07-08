import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { RegistrationData } from '../utils/randomData';

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoRegistration(): Promise<void> {
    await this.goto('/signup');
  }

  async fillRegistrationForm(data: RegistrationData): Promise<void> {
    await this.fillInput(/^name$/i, data.displayName);
    await this.fillInput(/username/i, data.username);
    await this.selectComboboxOption(/country/i, data.country);
    await this.fillInput(/business email|email/i, data.email);
    await this.fillInput(/^password$/i, data.password);
  }

  async submit(): Promise<void> {
    await this.clickButton(/create free account|create account/i);
  }

  async register(data: RegistrationData): Promise<void> {
    await this.fillRegistrationForm(data);
    await this.submit();
  }

  async expectRegistrationSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await this.expectToastOrInlineMessage(/account created|check your email|verify/i);
  }

  async expectRequiredFieldValidation(): Promise<void> {
    await this.expectToastOrInlineMessage(/required|please enter|please select|password/i);
  }

  async expectDuplicateUsernameValidation(): Promise<void> {
    await this.expectToastOrInlineMessage(/username.*(taken|exists|unavailable)|already exists|duplicate/i);
  }
}
