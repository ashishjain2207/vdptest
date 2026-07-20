import { expect, type Locator, type Page } from '@playwright/test';

export class HomeFeedPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  composerField(): Locator {
    return this.first(
      this.page.getByTestId('create-post-content'),
      this.page.getByLabel(/post content/i),
      this.page.getByPlaceholder(/what would you like to share/i),
    );
  }

  private readyMarker(): Locator {
    return this.first(
      this.composerField(),
      this.page.getByText(/all caught up|no posts yet|log in to see posts/i),
      this.page.locator('article').first(),
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/posts');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts(?:\?|$)/);
    await expect(this.readyMarker()).toBeVisible();
  }

  async expectGuestAccessBlocked(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/posts(?:\?|$)/);
    await expect(this.page).toHaveURL(/\/(login|access-denied|onboarding)(?:\?|$)/);
  }

  postCardByContent(content: string): Locator {
    return this.page.locator('article').filter({ hasText: content }).first();
  }

  async openPostByContent(content: string): Promise<void> {
    await this.postCardByContent(content).click();
  }

  async expectPostVisible(content: string): Promise<void> {
    await expect(this.postCardByContent(content)).toBeVisible();
  }

  async openPostActions(content: string): Promise<void> {
    const card = this.postCardByContent(content);
    await card.getByRole('button', { name: /post actions/i }).click();
  }

  async expectPostMenuActionUnavailable(content: string, actionLabel: RegExp): Promise<void> {
    await this.openPostActions(content);
    await expect(this.page.getByRole('menuitem', { name: actionLabel })).toHaveCount(0);
    await this.page.keyboard.press('Escape').catch(() => {});
  }
}
