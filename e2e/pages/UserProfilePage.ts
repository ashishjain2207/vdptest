import { expect, Locator, Page } from '@playwright/test';

import { e2eConfig, requireSeedValue } from '../utils/env';

export class UserProfilePage {
  readonly page: Page;
  readonly profileHeader: Locator;
  readonly postsList: Locator;
  readonly followButton: Locator;
  readonly unfollowButton: Locator;
  readonly followersCount: Locator;
  readonly editProfileButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profileHeader = page
      .getByTestId('profile-header')
      .or(page.getByRole('banner'))
      .or(page.getByRole('heading').first());
    this.postsList = page.getByTestId('profile-posts').or(page.getByRole('main')).first();
    this.followButton = page
      .getByTestId('follow-button')
      .or(page.getByRole('button', { name: /^follow$/i }))
      .first();
    this.unfollowButton = page
      .getByTestId('unfollow-button')
      .or(page.getByRole('button', { name: /unfollow/i }))
      .first();
    this.followersCount = page
      .getByTestId('followers-count')
      .or(page.getByText(/followers/i))
      .first();
    this.editProfileButton = page
      .getByTestId('edit-profile-button')
      .or(page.getByRole('link', { name: /edit profile/i }))
      .or(page.getByRole('button', { name: /edit profile/i }))
      .first();
  }

  async gotoOwnProfile(): Promise<void> {
    const ownUserId = requireSeedValue(e2eConfig.normalUser.userId, 'E2E_NORMAL_USER_ID');
    await this.gotoUserProfile(ownUserId);
  }

  async gotoUserProfile(userIdOrUsername: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(userIdOrUsername)}`);
  }

  postCardByText(text: string): Locator {
    return this.page
      .getByTestId('profile-post-card')
      .filter({ hasText: text })
      .or(this.page.getByTestId('post-card').filter({ hasText: text }))
      .or(this.page.locator('article').filter({ hasText: text }))
      .first();
  }

  postEditButton(text: string): Locator {
    return this.postCardByText(text)
      .getByTestId('post-edit-button')
      .or(this.postCardByText(text).getByRole('button', { name: /edit/i }))
      .first();
  }

  postDeleteButton(text: string): Locator {
    return this.postCardByText(text)
      .getByTestId('post-delete-button')
      .or(this.postCardByText(text).getByRole('button', { name: /delete|remove/i }))
      .first();
  }

  async openPost(text: string): Promise<void> {
    await this.postCardByText(text).click();
  }

  async expectProfileLoaded(): Promise<void> {
    await expect(this.profileHeader).toBeVisible();
    await expect(this.postsList).toBeVisible();
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postCardByText(text)).toBeVisible();
  }

  async expectPostNotVisible(text: string): Promise<void> {
    await expect(this.postCardByText(text)).toBeHidden();
  }

  async expectEditUnavailableForPost(text: string): Promise<void> {
    await expect(this.postEditButton(text)).toBeHidden();
  }

  async expectDeleteUnavailableForPost(text: string): Promise<void> {
    await expect(this.postDeleteButton(text)).toBeHidden();
  }

  async follow(): Promise<void> {
    await this.followButton.click();
  }

  async unfollow(): Promise<void> {
    await this.unfollowButton.click();
  }

  async expectFollowing(): Promise<void> {
    await expect(this.unfollowButton).toBeVisible();
  }

  async expectNotFollowing(): Promise<void> {
    await expect(this.followButton).toBeVisible();
  }

  async expectCannotFollowSelf(): Promise<void> {
    await expect(this.followButton).toBeHidden();
  }

  async expectFollowersCountChanged(previousText: string): Promise<void> {
    await expect(this.followersCount).not.toHaveText(previousText);
  }

  async getFollowersCountText(): Promise<string> {
    return (await this.followersCount.textContent())?.trim() ?? '';
  }

  async expectProfileContains(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
