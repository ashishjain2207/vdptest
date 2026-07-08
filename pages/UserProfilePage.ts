import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class UserProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoProfile(userKey: string): Promise<void> {
    await this.goto(routes.profile(userKey));
    await expect(this.page).toHaveURL(new RegExp(`/profile/${encodeURIComponent(userKey)}`));
  }

  postByText(content: string): Locator {
    return this.byTestId('profile-post').filter({ hasText: content }).or(this.page.getByText(content)).first();
  }

  get followButton(): Locator {
    return this.byTestId('follow-user').or(this.page.getByRole('button', { name: /^follow$|^connect$/i })).first();
  }

  get unfollowButton(): Locator {
    return this.byTestId('unfollow-user').or(this.page.getByRole('button', { name: /following|unfollow|connected/i })).first();
  }

  get messageButton(): Locator {
    return this.byTestId('message-user').or(this.page.getByRole('button', { name: /message/i })).first();
  }

  get profileActionsButton(): Locator {
    return this.byTestId('profile-actions').or(this.page.getByRole('button', { name: /profile actions|more/i })).first();
  }

  async openEditProfile(): Promise<void> {
    await this.profileActionsButton.click();
    await this.page.getByRole('menuitem', { name: /edit profile/i }).click();
  }

  async followUser(): Promise<void> {
    await this.followButton.click();
    await expect(this.unfollowButton).toBeVisible();
  }

  async unfollowUser(): Promise<void> {
    await this.unfollowButton.click();
    await expect(this.followButton).toBeVisible();
  }

  async expectMessageButtonVisible(): Promise<void> {
    await expect(this.messageButton).toBeVisible();
  }

  async openMessageComposer(): Promise<void> {
    await this.messageButton.click();
  }

  async openPost(content: string): Promise<void> {
    await this.postByText(content).click();
  }
}
