import { expect, type Locator, type Page } from '@playwright/test';

export class UserProfilePage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  profileHeading(): Locator {
    return this.first(
      this.page.getByRole('heading', { level: 1 }),
      this.page.locator('[data-testid="profile-heading"]'),
    );
  }

  followButton(): Locator {
    return this.first(
      this.page.getByTestId('profile-follow-button'),
      this.page.getByRole('button', { name: /follow|following|unfollow/i }),
    );
  }

  editProfileButton(): Locator {
    return this.first(
      this.page.getByTestId('profile-edit-button'),
      this.page.getByRole('button', { name: /edit profile/i }),
    );
  }

  async goto(profileKey: string): Promise<void> {
    await this.page.goto(`/profile/${encodeURIComponent(profileKey)}`);
    await expect(this.profileHeading()).toBeVisible();
  }

  postCardByContent(content: string): Locator {
    return this.page.locator('article').filter({ hasText: content }).first();
  }

  firstPostCard(): Locator {
    return this.page.locator('article').first();
  }

  async openPostByContent(content: string): Promise<void> {
    await this.postCardByContent(content).click();
  }

  async expectPostVisible(content: string): Promise<void> {
    await expect(this.postCardByContent(content)).toBeVisible();
  }

  async expectPostNotVisible(content: string): Promise<void> {
    await expect(this.postCardByContent(content)).toHaveCount(0);
  }

  async openPostActions(content: string): Promise<void> {
    await this.postCardByContent(content).getByRole('button', { name: /post actions/i }).click();
  }

  async expectPostMenuActionUnavailable(content: string, actionLabel: RegExp): Promise<void> {
    await this.openPostActions(content);
    await expect(this.page.getByRole('menuitem', { name: actionLabel })).toHaveCount(0);
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async followUser(): Promise<void> {
    await this.followButton().click();
  }

  async expectFollowButtonState(label: RegExp): Promise<void> {
    await expect(this.followButton()).toHaveText(label);
  }

  async expectSelfFollowUnavailable(): Promise<void> {
    const visible = await this.followButton().isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) {
      return;
    }

    await expect(this.followButton()).toBeDisabled();
  }

  async openOwnProfileEditor(): Promise<void> {
    if (await this.editProfileButton().isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.editProfileButton().click();
      return;
    }

    await this.page.getByRole('button', { name: /profile actions/i }).click();
    await this.page.getByRole('menuitem', { name: /edit profile/i }).click();
  }
}
