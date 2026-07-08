import { expect, type Locator, type Page } from '@playwright/test';

export class UserProfilePage {
  readonly page: Page;
  readonly profileContainer: Locator;
  readonly postsList: Locator;
  readonly followButton: Locator;
  readonly unfollowButton: Locator;
  readonly followersCount: Locator;
  readonly editProfileButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profileContainer = page.getByTestId('user-profile').or(page.locator('main')).first();
    this.postsList = page.getByTestId('profile-posts').or(page.locator('article, [role="article"]'));
    this.followButton = page.getByTestId('follow-button').or(page.getByRole('button', { name: /^follow$/i })).first();
    this.unfollowButton = page.getByTestId('unfollow-button').or(page.getByRole('button', { name: /unfollow/i })).first();
    this.followersCount = page.getByTestId('followers-count').or(page.getByText(/followers/i)).first();
    this.editProfileButton = page.getByTestId('edit-profile').or(page.getByRole('link', { name: /edit profile/i })).or(page.getByRole('button', { name: /edit profile/i })).first();
  }

  async gotoProfile(profileKey: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(profileKey)}`);
    await expect(this.profileContainer).toBeVisible();
  }

  async gotoOwnProfile(profileKey: string): Promise<void> {
    await this.gotoProfile(profileKey);
  }

  postByText(text: string): Locator {
    return this.page.getByTestId('post-card').filter({ hasText: text }).or(this.page.locator('article, [role="article"]').filter({ hasText: text })).first();
  }

  async openPostByText(text: string): Promise<void> {
    const post = this.postByText(text);
    await expect(post).toBeVisible();
    await post.click();
  }

  async expectPostVisible(text: string): Promise<void> {
    await expect(this.postByText(text)).toBeVisible();
  }

  async expectPostNotVisible(text: string): Promise<void> {
    await expect(this.postByText(text)).toHaveCount(0);
  }

  async expectEditAvailableForPost(text: string): Promise<void> {
    const post = this.postByText(text);
    await expect(post).toBeVisible();
    const actionMenu = post.getByRole('button', { name: /actions|more/i }).first();
    if (await actionMenu.count() > 0) {
      await actionMenu.click();
    }
    await expect(this.page.getByRole('menuitem', { name: /edit/i }).or(post.getByRole('button', { name: /edit/i })).first()).toBeVisible();
  }

  async expectEditUnavailableForPost(text?: string): Promise<void> {
    const scope = text ? this.postByText(text) : this.profileContainer;
    await expect(scope).toBeVisible();
    const actionMenu = scope.getByRole('button', { name: /actions|more/i }).first();
    if (await actionMenu.count() > 0 && await actionMenu.isVisible()) {
      await actionMenu.click();
    }
    await expect(this.page.getByRole('menuitem', { name: /edit/i }).or(scope.getByRole('button', { name: /edit/i }))).toHaveCount(0);
  }

  async expectDeleteUnavailableForPost(text?: string): Promise<void> {
    const scope = text ? this.postByText(text) : this.profileContainer;
    await expect(scope).toBeVisible();
    const actionMenu = scope.getByRole('button', { name: /actions|more/i }).first();
    if (await actionMenu.count() > 0 && await actionMenu.isVisible()) {
      await actionMenu.click();
    }
    await expect(this.page.getByRole('menuitem', { name: /delete|remove/i }).or(scope.getByRole('button', { name: /delete|remove/i }))).toHaveCount(0);
  }

  async follow(): Promise<void> {
    await expect(this.followButton).toBeVisible();
    await this.followButton.click();
  }

  async unfollow(): Promise<void> {
    await expect(this.unfollowButton).toBeVisible();
    await this.unfollowButton.click();
  }

  async expectFollowingState(): Promise<void> {
    await expect(this.unfollowButton).toBeVisible();
  }

  async expectNotFollowingState(): Promise<void> {
    await expect(this.followButton).toBeVisible();
  }

  async expectSelfFollowPrevented(): Promise<void> {
    const followCount = await this.followButton.count();
    if (followCount === 0) {
      await expect(this.followButton).toHaveCount(0);
      return;
    }
    await expect(this.followButton).toBeDisabled();
  }

  async expectProfileContains(text: string): Promise<void> {
    await expect(this.profileContainer).toContainText(text);
  }
}
