import { expect, type Locator, type Page } from '@playwright/test';
import { testId } from '../utils/selectors';

export const routes = {
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  feed: '/posts',
  profile: (userKey: string) => `/profile/${encodeURIComponent(userKey)}`,
  post: (postId: string) => `/posts/${encodeURIComponent(postId)}`,
  messages: '/messages',
  conversation: (conversationId: string) => `/messages/${encodeURIComponent(conversationId)}`,
  settingsProfile: '/settings/profile',
  adminModeration: '/admin/content-moderation',
};

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  byTestId(id: string): Locator {
    return this.page.locator(testId(id));
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async expectPath(pathPattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pathPattern);
  }

  async expectVisibleText(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async expectToastOrError(message: string | RegExp): Promise<void> {
    const toastOrAlert = this.page
      .getByRole('alert')
      .or(this.page.locator('[data-sonner-toast]'))
      .or(this.page.locator('[aria-live="polite"]'))
      .or(this.page.getByText(message));
    await expect(toastOrAlert.filter({ hasText: message }).first()).toBeVisible();
  }

  async expectValidationMessage(message: string | RegExp): Promise<void> {
    const validation = this.page
      .getByRole('alert')
      .or(this.page.locator('[aria-invalid="true"]'))
      .or(this.page.getByText(message));
    await expect(validation.filter({ hasText: message }).first()).toBeVisible();
  }
}
