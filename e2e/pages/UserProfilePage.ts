import { expect, type Locator, type Page } from '@playwright/test';
import { clickFirst } from '../utils/locators';

export class UserProfilePage {
  constructor(private readonly page: Page) {}

  async gotoUserProfile(userId: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(userId)}`);
  }

  async gotoOwnProfile(ownUserId = 'me'): Promise<void> {
    await this.gotoUserProfile(ownUserId);
  }

  private postCardByText(contentSnippet: string): Locator {
    return this.page
      .locator('[data-testid="post-card"], article, [data-post-id]')
      .filter({ hasText: contentSnippet })
      .first();
  }

  async expectNoEditOptionForPost(contentSnippet: string): Promise<void> {
    const postCard = this.postCardByText(contentSnippet);
    await expect(postCard).toBeVisible();

    const menuTrigger = postCard.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
    if (await menuTrigger.count()) {
      await menuTrigger.click();
    }

    await expect(this.page.getByRole('menuitem', { name: /edit/i })).toHaveCount(0);
    await expect(this.page.getByRole('button', { name: /edit/i })).toHaveCount(0);
  }

  async expectNoDeleteOptionForPost(contentSnippet: string): Promise<void> {
    const postCard = this.postCardByText(contentSnippet);
    await expect(postCard).toBeVisible();

    const menuTrigger = postCard.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
    if (await menuTrigger.count()) {
      await menuTrigger.click();
    }

    await expect(this.page.getByRole('menuitem', { name: /delete/i })).toHaveCount(0);
    await expect(this.page.getByRole('button', { name: /delete/i })).toHaveCount(0);
  }

  async followUser(): Promise<void> {
    await clickFirst(this.page, ['[data-testid="follow-button"]', 'button:has-text("Follow")']);
  }

  async unfollowUser(): Promise<void> {
    await clickFirst(this.page, ['[data-testid="unfollow-button"]', 'button:has-text("Unfollow")']);
  }

  async expectFollowState(isFollowing: boolean): Promise<void> {
    if (isFollowing) {
      await expect(this.page.getByRole('button', { name: /unfollow/i }).first()).toBeVisible();
    } else {
      await expect(this.page.getByRole('button', { name: /follow/i }).first()).toBeVisible();
    }
  }

  async expectCannotFollowSelf(): Promise<void> {
    await expect(this.page.locator('[data-testid="follow-button"], button:has-text("Follow")')).toHaveCount(0);
  }
}
