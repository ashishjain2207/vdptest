import { expect, type Locator, type Page } from '@playwright/test';

export class UserProfilePage {
  readonly page: Page;
  readonly followButton: Locator;
  readonly pageRoot: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageRoot = page.getByTestId('user-profile-page');
    this.followButton = page.getByTestId('profile-follow-button');
  }

  async goto(userKey: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(userKey)}`);
    await expect(this.pageRoot).toBeVisible();
  }

  postCardByText(text: string): Locator {
    return this.page.getByTestId('post-card').filter({ hasText: text }).first();
  }

  async openPostByText(text: string): Promise<void> {
    await this.postCardByText(text).click();
  }

  async expectOwnProfileFollowUnavailable(): Promise<void> {
    await expect(this.followButton).toHaveCount(0);
  }

  async follow(): Promise<void> {
    await this.followButton.click();
  }

  async expectFollowButtonLabel(label: RegExp): Promise<void> {
    await expect(this.followButton).toHaveText(label);
  }

  async expectPostActionHidden(text: string, actionTestId: 'post-edit-action' | 'post-delete-action'): Promise<void> {
    const card = this.postCardByText(text);
    await expect(card).toBeVisible();
    await card.getByTestId('post-actions-trigger').click();
    await expect(this.page.getByTestId(actionTestId)).toHaveCount(0);
    await this.page.keyboard.press('Escape');
  }
}
