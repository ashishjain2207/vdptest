import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class PostDetailPage {
  readonly page: Page;
  readonly root: Locator;
  readonly actionsButton: Locator;
  readonly editAction: Locator;
  readonly deleteAction: Locator;
  readonly commentInput: Locator;
  readonly commentSubmitButton: Locator;
  readonly commentsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('post-detail-page');
    this.actionsButton = page.getByTestId('post-detail-actions');
    this.editAction = page.getByTestId('post-detail-edit');
    this.deleteAction = page.getByTestId('post-detail-delete');
    this.commentInput = page.getByTestId('post-detail-comment-input');
    this.commentSubmitButton = page.getByTestId('post-detail-comment-submit');
    this.commentsList = page.getByTestId('post-detail-comments-list');
  }

  async goto(postId: string): Promise<void> {
    await this.page.goto(`/posts/${encodeURIComponent(postId)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async openActions(): Promise<void> {
    await this.actionsButton.click();
  }

  async openEdit(): Promise<void> {
    await this.openActions();
    await this.editAction.click();
  }

  async openDelete(): Promise<void> {
    await this.openActions();
    await this.deleteAction.click();
  }

  async addComment(content: string): Promise<void> {
    await this.commentInput.fill(content);
    await this.commentSubmitButton.click();
  }

  commentItem(commentId: string): Locator {
    return this.page.locator(`[data-testid="comment-item"][data-comment-id="${commentId}"]`);
  }

  commentItemByText(content: string): Locator {
    return this.page.locator('[data-testid="comment-item"]').filter({ hasText: content }).first();
  }

  async openCommentActions(commentId: string): Promise<void> {
    await this.commentItem(commentId).getByTestId('comment-actions').click();
  }

  async openCommentEdit(commentId: string): Promise<void> {
    await this.openCommentActions(commentId);
    await this.commentItem(commentId).getByTestId('comment-edit').click();
  }

  async editComment(commentId: string, content: string): Promise<void> {
    await this.openCommentEdit(commentId);
    const item = this.commentItem(commentId);
    await item.locator('textarea').fill(content);
    await item.getByRole('button', { name: /save|speichern/i }).click();
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.openCommentActions(commentId);
    await this.commentItem(commentId).getByTestId('comment-delete').click();
  }
}
