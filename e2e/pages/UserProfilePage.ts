import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoProfile(profileKey: string): Promise<void> {
    await this.goto(`/profile/${encodeURIComponent(profileKey)}`);
  }

  async openOwnProfileFromSettings(): Promise<void> {
    await this.goto('/settings/profile');
  }

  async follow(): Promise<void> {
    await this.page.getByRole('button', { name: /^follow$/i }).first().click();
  }

  async unfollow(): Promise<void> {
    await this.page.getByRole('button', { name: /following|unfollow/i }).first().click();
  }

  async expectFollowing(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /following|unfollow/i }).first()).toBeVisible();
  }

  async expectNotFollowing(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /^follow$/i }).first()).toBeVisible();
  }

  async startMessage(): Promise<void> {
    await this.page.getByRole('button', { name: /message/i }).first().click();
  }

  async expectMessageUnavailableForGuest(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?.*)?$/);
  }

  async openPost(content: string): Promise<void> {
    await this.page.getByText(content).first().click();
  }

  async openPostActionsFor(content: string): Promise<void> {
    const article = this.page.locator('article').filter({ hasText: content }).first();
    await article.getByRole('button', { name: /post actions/i }).click();
  }

  async clickEditPost(content: string): Promise<void> {
    await this.openPostActionsFor(content);
    await this.page.getByRole('menuitem', { name: /edit/i }).click();
  }

  async clickDeletePost(content: string): Promise<void> {
    await this.openPostActionsFor(content);
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
  }

  async expectEditUnavailableForPost(content: string): Promise<void> {
    const article = this.page.locator('article').filter({ hasText: content }).first();
    const actions = article.getByRole('button', { name: /post actions/i }).first();
    if (!(await actions.isVisible().catch(() => false))) {
      return;
    }
    await actions.click();
    await expect(this.page.getByRole('menuitem', { name: /edit/i })).toHaveCount(0);
  }
}
