import { expect, type Locator, type Page, type AriaRole } from '@playwright/test';
import { byTestId } from '../utils/selectors';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  byTestId(id: string): Locator {
    return byTestId(this.page, id);
  }

  byRoleOrTestId(id: string, role: AriaRole, options: Parameters<Page['getByRole']>[1]): Locator {
    return this.byTestId(id).or(this.page.getByRole(role, options)).first();
  }

  textInput(name: string | RegExp): Locator {
    return this.page.getByLabel(name).or(this.page.getByPlaceholder(name)).first();
  }

  async fillInput(name: string | RegExp, value: string): Promise<void> {
    await this.textInput(name).fill(value);
  }

  async clickButton(name: string | RegExp): Promise<void> {
    await this.page.getByRole('button', { name }).first().click();
  }

  async expectUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  async expectVisibleText(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async expectToastOrInlineMessage(text: string | RegExp): Promise<void> {
    const toast = this.page
      .locator('[role="status"], [role="alert"], [data-sonner-toast]')
      .filter({ hasText: text })
      .first();
    const inline = this.page.getByText(text).first();
    await expect(toast.or(inline)).toBeVisible();
  }

  async expectNoHardError(): Promise<void> {
    await expect(this.page.getByText(/something went wrong|uncaught|stack trace/i)).toHaveCount(0);
  }

  async selectComboboxOption(label: string | RegExp, optionText: string): Promise<void> {
    const input = this.page.getByLabel(label).first();
    await input.fill(optionText);
    await input.press('ArrowDown');
    await input.press('Enter');
  }
}
