import { expect, type Locator, type Page } from '@playwright/test';

type SupportedRole = 'button' | 'link' | 'textbox' | 'checkbox' | 'heading' | 'tab' | 'menuitem';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  locatorAny(...locators: Locator[]): Locator {
    const [first, ...rest] = locators;
    return rest.reduce((combined, locator) => combined.or(locator), first).first();
  }

  byTestIdOrRole(testId: string, role: SupportedRole, name: string | RegExp): Locator {
    return this.locatorAny(
      this.page.getByTestId(testId),
      this.page.getByRole(role, { name }),
    );
  }

  field(testId: string, names: Array<string | RegExp>): Locator {
    const locators = [
      this.page.getByTestId(testId),
      this.page.locator(`#${testId}`),
      this.page.locator(`[name="${testId}"]`),
      ...names.flatMap((name) => [
        this.page.getByLabel(name),
        this.page.getByPlaceholder(name),
      ]),
    ];

    return this.locatorAny(...locators);
  }

  async fillIfPresent(locator: Locator, value: string): Promise<void> {
    if (!value) {
      return;
    }

    if ((await locator.count()) === 0) {
      return;
    }

    if (await locator.isVisible().catch(() => false)) {
      await locator.fill(value);
    }
  }

  async clickIfPresent(locator: Locator): Promise<boolean> {
    if ((await locator.count()) === 0) {
      return false;
    }

    if (await locator.isVisible().catch(() => false)) {
      await locator.click();
      return true;
    }

    return false;
  }

  async expectNoValidationErrors(): Promise<void> {
    await expect(this.page.locator('[aria-invalid="true"]')).toHaveCount(0);
  }

  async expectVisibleText(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async expectToastOrInlineMessage(text: string | RegExp): Promise<void> {
    await expect(
      this.locatorAny(
        this.page.getByRole('status').filter({ hasText: text }),
        this.page.getByRole('alert').filter({ hasText: text }),
        this.page.getByText(text),
      ),
    ).toBeVisible();
  }
}
