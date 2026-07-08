import { expect, type Locator, type Page } from '@playwright/test';
import { testId } from '../utils/selectors';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  byTestId(...parts: Array<string | number | null | undefined>): Locator {
    return this.page.getByTestId(testId(...parts));
  }

  byTestIdOr(testIdValue: string, fallback: Locator): Locator {
    return this.page.getByTestId(testIdValue).or(fallback).first();
  }

  async expectPath(pathOrPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pathOrPattern);
  }

  async expectToast(message: string | RegExp): Promise<void> {
    await expect(
      this.page
        .getByRole('status')
        .or(this.page.getByRole('alert'))
        .or(this.page.locator('[data-sonner-toast]'))
        .filter({ hasText: message })
        .first(),
    ).toBeVisible();
  }

  async expectValidationMessage(message: string | RegExp): Promise<void> {
    await expect(
      this.page
        .getByRole('alert')
        .or(this.page.locator('[aria-invalid="true"]'))
        .or(this.page.locator('.text-destructive, .text-red-500'))
        .filter({ hasText: message })
        .first(),
    ).toBeVisible();
  }

  async expectVisibleText(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
