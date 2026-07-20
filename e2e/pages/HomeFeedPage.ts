import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class HomeFeedPage {
  readonly page: Page;
  readonly root: Locator;
  readonly list: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('home-feed-page');
    this.list = page.getByTestId('home-feed-list');
  }

  async goto(): Promise<void> {
    await this.page.goto('/posts', { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.list).toBeVisible();
  }

  postCard(postId: string): Locator {
    return this.page.locator(`[data-testid="post-card"][data-post-id="${postId}"]`);
  }

  postCardByText(content: string): Locator {
    return this.page.locator('[data-testid="post-card"]').filter({ hasText: content }).first();
  }

  async waitForPostCard(postId: string): Promise<Locator> {
    const card = this.postCard(postId);
    await expect(card).toBeVisible();
    return card;
  }

  async openPostActions(postId: string): Promise<void> {
    await this.postCard(postId).getByTestId('post-card-actions').click();
  }

  async openEditForPost(postId: string): Promise<void> {
    await this.openPostActions(postId);
    await this.postCard(postId).getByTestId('post-card-edit').click();
  }

  async openDeleteForPost(postId: string): Promise<void> {
    await this.openPostActions(postId);
    await this.postCard(postId).getByTestId('post-card-delete').click();
  }

  async toggleComments(postId: string): Promise<void> {
    await this.postCard(postId).getByTestId('post-card-comment-toggle').click();
  }
}
