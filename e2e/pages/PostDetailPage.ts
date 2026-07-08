import { expect, type Locator, type Page } from '@playwright/test';

export class PostDetailPage {
  readonly page: Page;
  readonly pageRoot: Locator;
  readonly commentInput: Locator;
  readonly commentSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageRoot = page.getByTestId('post-detail-page');
    this.commentInput = page.getByTestId('post-detail-comment-input');
    this.commentSubmitButton = page.getByTestId('post-detail-comment-submit-button');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.pageRoot).toBeVisible();
    await expect(this.page).toHaveURL(/\/posts\//u);
  }

  async openActionsMenu(): Promise<void> {
    await this.page.getByTestId('post-detail-actions-trigger').click();
  }

  async addComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.commentSubmitButton.click();
  }

  commentItemByText(text: string): Locator {
    return this.page.getByTestId('comment-item').filter({ hasText: text }).first();
  }

  async openCommentActions(commentText: string): Promise<void> {
    await this.commentItemByText(commentText).getByTestId('comment-actions-trigger').click();
  }

  deleteCommentAction(): Locator {
    return this.page.getByTestId('comment-delete-action');
  }

  emptyCommentValidation(): Locator {
    return this.page.locator('text=/comment|reply/i').filter({ hasText: /required|empty|please/i }).first();
  }
}
