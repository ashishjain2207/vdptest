import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserProfilePage {
  readonly page: Page;
  readonly root: Locator;
  readonly profileActionsTrigger: Locator;
  readonly profileEditAction: Locator;
  readonly followButton: Locator;
  readonly postsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('user-profile-page');
    this.profileActionsTrigger = page.getByTestId('profile-actions-trigger');
    this.profileEditAction = page.getByTestId('profile-edit-action');
    this.followButton = page.getByTestId('profile-follow-button');
    this.postsTab = page.getByTestId('profile-posts-tab');
  }

  async goto(userIdOrHandle: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(userIdOrHandle)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async openProfileActions(): Promise<void> {
    await this.profileActionsTrigger.click();
  }

  async goToEditProfile(): Promise<void> {
    await this.openProfileActions();
    await this.profileEditAction.click();
  }

  async openPostsTab(): Promise<void> {
    await this.postsTab.click();
  }

  async toggleFollow(): Promise<void> {
    await this.followButton.click();
  }

  postCard(postId: string): Locator {
    return this.page.locator(`[data-testid="post-card"][data-post-id="${postId}"]`);
  }
}
