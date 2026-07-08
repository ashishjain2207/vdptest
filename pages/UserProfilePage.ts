import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserProfilePage extends BasePage {
  readonly followButton: Locator;
  readonly messageButton: Locator;
  readonly editProfileButton: Locator;

  constructor(page: Page) {
    super(page);
    this.followButton = this.byTestIdOr('profile-follow-button', page.getByRole('button', { name: /follow|following/i }).first());
    this.messageButton = this.byTestIdOr('profile-message-button', page.getByRole('button', { name: /message/i }).first());
    this.editProfileButton = this.byTestIdOr('profile-edit-button', page.getByRole('button', { name: /edit profile/i }).first());
  }

  async openProfile(userIdOrHandle: string): Promise<void> {
    await this.goto(`/profile/${encodeURIComponent(userIdOrHandle)}`);
  }

  async expectProfileLoaded(displayName?: string | RegExp): Promise<void> {
    if (displayName) {
      await this.expectVisibleText(displayName);
      return;
    }
    await expect(this.page.locator('main')).toBeVisible();
  }

  postByText(content: string | RegExp): Locator {
    return this.page.getByText(content).first();
  }

  async openPost(content: string | RegExp): Promise<void> {
    await this.postByText(content).click();
  }

  async expectPostVisible(content: string | RegExp): Promise<void> {
    await expect(this.postByText(content)).toBeVisible();
  }

  async expectPostHidden(content: string | RegExp): Promise<void> {
    await expect(this.postByText(content)).toBeHidden();
  }

  async follow(): Promise<void> {
    await this.followButton.filter({ hasText: /follow/i }).click();
    await expect(this.followButton).toContainText(/following/i);
  }

  async unfollow(): Promise<void> {
    await this.followButton.filter({ hasText: /following/i }).click();
    await expect(this.followButton).toContainText(/follow/i);
  }

  async openMessages(): Promise<void> {
    await this.messageButton.click();
    await expect(this.page).toHaveURL(/\/messages/);
  }

  async expectMessageActionHiddenForGuest(): Promise<void> {
    await expect(this.messageButton).toHaveCount(0);
  }
}
