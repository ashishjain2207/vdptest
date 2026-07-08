import { expect, type Locator, type Page } from '@playwright/test';
import type { RegistrationInput } from '../utils/dataFactory';

async function fillIfVisible(locator: Locator, value?: string): Promise<void> {
  if (!value || await locator.count() === 0 || !await locator.first().isVisible()) {
    return;
  }
  await locator.first().fill(value);
}

async function checkIfVisible(locator: Locator, shouldCheck = true): Promise<void> {
  if (!shouldCheck || await locator.count() === 0 || !await locator.first().isVisible()) {
    return;
  }
  await locator.first().check();
}

export class RegistrationPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly dateOfBirthInput: Locator;
  readonly countryInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.getByTestId('registration-full-name').or(page.getByLabel(/name|full name/i)).or(page.locator('#name')).first();
    this.usernameInput = page.getByTestId('registration-username').or(page.getByLabel(/username/i)).or(page.locator('#username')).first();
    this.emailInput = page.getByTestId('registration-email').or(page.getByLabel(/email/i)).or(page.locator('#email')).first();
    this.passwordInput = page.getByTestId('registration-password').or(page.getByLabel(/^password/i)).or(page.locator('#password')).first();
    this.confirmPasswordInput = page.getByTestId('registration-confirm-password').or(page.getByLabel(/confirm password/i)).or(page.locator('#confirmPassword, #confirm-password')).first();
    this.dateOfBirthInput = page.getByTestId('registration-date-of-birth').or(page.getByLabel(/birth|date of birth/i)).or(page.locator('input[type="date"]')).first();
    this.countryInput = page.getByTestId('registration-country').or(page.getByLabel(/country/i)).or(page.locator('#signup-home-country')).first();
    this.termsCheckbox = page.getByTestId('registration-terms').or(page.getByLabel(/terms|conditions/i)).first();
    this.submitButton = page.getByTestId('registration-submit').or(page.getByRole('button', { name: /register|sign up|create account/i })).first();
    this.validationErrors = page.getByRole('alert').or(page.locator('.text-destructive, [aria-invalid="true"]'));
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await expect(this.fullNameInput).toBeVisible();
  }

  async fillRegistrationForm(data: RegistrationInput): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.usernameInput.fill(data.username ?? '');
    await fillIfVisible(this.countryInput, data.homeCountry);
    await this.emailInput.fill(data.email ?? '');
    await this.passwordInput.fill(data.password);
    await fillIfVisible(this.confirmPasswordInput, data.confirmPassword ?? data.password);
    await fillIfVisible(this.dateOfBirthInput, data.dateOfBirth);
    await checkIfVisible(this.termsCheckbox, data.acceptTerms);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async expectRegistrationSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(login|onboarding|posts)/);
    await expect(this.validationErrors.first()).toBeHidden();
  }

  async expectDuplicateUsernameError(): Promise<void> {
    await expect(this.page).toHaveURL(/\/signup/);
    await expect(this.validationErrors.first()).toBeVisible();
    await expect(this.validationErrors.first()).toContainText(/username|taken|already|duplicate|exists/i);
  }
}
