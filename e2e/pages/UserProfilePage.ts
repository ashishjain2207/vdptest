import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type ProfileTarget = {
  userId?: string;
  handle?: string;
  profilePath?: string;
};

export class UserProfilePage extends BasePage {
  async goTo(target: ProfileTarget): Promise<void> {
    if (target.profilePath) {
      await this.goto(target.profilePath);
      return;
    }

    const key = target.userId ?? target.handle;
    if (!key) {
      throw new Error('A userId, handle, or profilePath is required to open a profile.');
    }

    await this.goto(`/profile/${encodeURIComponent(key)}`);
  }

  async goToCurrentUserProfile(): Promise<void> {
    const profileLink = this.locatorAny(
      this.page.getByTestId('current-user-profile-link'),
      this.page.getByRole('link', { name: /profile|my profile/i }),
      this.page.getByRole('button', { name: /profile|account|me/i }),
    );

    if (await this.clickIfPresent(profileLink)) {
      await expect(this.page).toHaveURL(/\/profile\//);
      return;
    }

    const fallback = process.env.E2E_NORMAL_USER_ID ?? process.env.E2E_NORMAL_USER_HANDLE;
    if (!fallback) {
      throw new Error('Set E2E_NORMAL_USER_ID or E2E_NORMAL_USER_HANDLE to navigate to the current profile.');
    }
    await this.goto(`/profile/${encodeURIComponent(fallback)}`);
  }

  postByText(text: string) {
    return this.locatorAny(
      this.page.getByTestId(`profile-post-${text}`),
      this.page.getByText(text),
    );
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postByText(text)).toBeVisible();
  }

  async expectPostRemoved(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toHaveCount(0);
  }

  async openPost(text: string): Promise<void> {
    await this.postByText(text).click();
  }

  followButton() {
    return this.byTestIdOrRole('follow-button', 'button', /^follow$/i);
  }

  unfollowButton() {
    return this.byTestIdOrRole('unfollow-button', 'button', /unfollow|following/i);
  }

  async follow(): Promise<void> {
    await this.followButton().click();
  }

  async unfollow(): Promise<void> {
    await this.unfollowButton().click();
  }

  async expectFollowingState(): Promise<void> {
    await expect(this.unfollowButton()).toBeVisible();
  }

  async expectNotFollowingState(): Promise<void> {
    await expect(this.followButton()).toBeVisible();
  }

  messageButton() {
    return this.byTestIdOrRole('message-user-button', 'button', /message|send message/i);
  }

  async openMessageComposer(): Promise<void> {
    await this.messageButton().click();
  }

  async expectMessageUnavailableForGuest(): Promise<void> {
    const button = this.messageButton();
    if ((await button.count()) === 0) {
      await expect(button).toHaveCount(0);
      return;
    }
    if (await button.isVisible().catch(() => false)) {
      await expect(button).toBeDisabled();
      return;
    }
    await expect(button).toBeHidden();
  }

  async expectEditUnavailableForPost(text: string): Promise<void> {
    await this.postByText(text).click();
    await expect(
      this.locatorAny(
        this.page.getByTestId('post-edit-button'),
        this.page.getByRole('button', { name: /edit/i }),
        this.page.getByRole('menuitem', { name: /edit/i }),
      ),
    ).toHaveCount(0);
  }
}
