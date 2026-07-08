import { expect, type Locator, type Page } from '@playwright/test';

export class PostDetailPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  postActionsButton(): Locator {
    return this.first(
      this.page.getByTestId('post-detail-actions'),
      this.page.getByRole('button', { name: /post actions/i }),
    );
  }

  commentField(): Locator {
    return this.first(
      this.page.getByTestId('post-comment-input'),
      this.page.getByPlaceholder(/write a comment/i),
      this.page.getByLabel(/comment/i),
    );
  }

  submitCommentButton(): Locator {
    return this.first(
      this.page.getByTestId('post-comment-submit'),
      this.page.getByRole('button', { name: /post comment|add comment|submit/i }),
    );
  }

  editModalField(): Locator {
    return this.first(
      this.page.getByTestId('edit-post-content'),
      this.page.getByLabel(/post content/i),
      this.page.getByPlaceholder(/what would you like to share/i),
    );
  }

  saveEditedPostButton(): Locator {
    return this.first(
      this.page.getByTestId('edit-post-save'),
      this.page.getByRole('button', { name: /save|checking and publishing/i }),
    );
  }

  deletionConfirmButton(): Locator {
    return this.first(
      this.page.getByTestId('confirm-delete-post'),
      this.page.getByRole('button', { name: /^delete$/i }),
    );
  }

  async goto(postId: string): Promise<void> {
    await this.page.goto(`/posts/${encodeURIComponent(postId)}`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts\/[0-9a-fA-F-]+/);
    await expect(this.page.getByRole('heading', { name: /post/i })).toBeVisible();
  }

  async expectPostContent(content: string): Promise<void> {
    await expect(this.page.getByText(content, { exact: false })).toBeVisible();
  }

  async openPostActions(): Promise<void> {
    await this.postActionsButton().click();
  }

  async editPostFromMenu(updatedContent: string): Promise<void> {
    await this.openPostActions();
    await this.page.getByRole('menuitem', { name: /edit/i }).click();
    await this.editModalField().fill(updatedContent);
    await this.saveEditedPostButton().click();
  }

  async deletePostFromMenu(): Promise<void> {
    await this.openPostActions();
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
  }

  async confirmDeletion(): Promise<void> {
    await this.deletionConfirmButton().click();
  }

  async addComment(comment: string): Promise<void> {
    await this.commentField().fill(comment);
    await this.submitCommentButton().click();
  }

  async expectCommentVisible(commentText: string): Promise<void> {
    await expect(this.page.getByText(commentText, { exact: false })).toBeVisible();
  }

  async expectEmptyCommentBlocked(): Promise<void> {
    await expect(this.submitCommentButton()).toBeDisabled();
  }

  async deleteCommentByText(commentText: string): Promise<void> {
    const commentContainer = this.page.locator('div').filter({ hasText: commentText }).first();
    await commentContainer.getByRole('button', { name: /comment actions/i }).click();
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
  }

  async expectCommentDeleteUnavailable(commentText: string): Promise<void> {
    const commentContainer = this.page.locator('div').filter({ hasText: commentText }).first();
    await commentContainer.getByRole('button', { name: /comment actions/i }).click();
    await expect(this.page.getByRole('menuitem', { name: /delete/i })).toHaveCount(0);
    await this.page.keyboard.press('Escape').catch(() => {});
  }
}
