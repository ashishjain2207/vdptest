import { expect, Locator, Page } from '@playwright/test';

export class PostDetailPage {
  readonly page: Page;
  readonly postContent: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly editTextInput: Locator;
  readonly saveEditButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly commentInput: Locator;
  readonly submitCommentButton: Locator;
  readonly commentValidationError: Locator;
  readonly commentCount: Locator;
  readonly deletionConfirmation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.postContent = page.getByTestId('post-detail-content').or(page.locator('article')).first();
    this.editButton = page
      .getByTestId('post-edit-button')
      .or(page.getByRole('button', { name: /edit/i }))
      .first();
    this.deleteButton = page
      .getByTestId('post-delete-button')
      .or(page.getByRole('button', { name: /delete|remove/i }))
      .first();
    this.editTextInput = page
      .getByTestId('post-edit-text-input')
      .or(page.getByLabel(/edit post|post text/i))
      .or(page.getByPlaceholder(/edit|write|post/i))
      .first();
    this.saveEditButton = page
      .getByTestId('post-edit-save')
      .or(page.getByRole('button', { name: /save|update/i }))
      .first();
    this.confirmDeleteButton = page
      .getByTestId('confirm-delete-post')
      .or(page.getByRole('button', { name: /confirm|delete|remove/i }))
      .last();
    this.commentInput = page
      .getByTestId('comment-input')
      .or(page.getByLabel(/comment/i))
      .or(page.getByPlaceholder(/comment/i))
      .first();
    this.submitCommentButton = page
      .getByTestId('comment-submit')
      .or(page.getByRole('button', { name: /add comment|submit|comment/i }))
      .first();
    this.commentValidationError = page
      .getByTestId('comment-validation-error')
      .or(page.getByRole('alert'))
      .or(page.getByText(/comment.*empty|required|validation/i))
      .first();
    this.commentCount = page.getByTestId('comment-count').or(page.getByText(/comments/i)).first();
    this.deletionConfirmation = page
      .getByTestId('post-delete-success')
      .or(page.getByText(/post deleted|removed successfully|success/i))
      .first();
  }

  async gotoPost(postId: string): Promise<void> {
    await this.page.goto(`/posts/${encodeURIComponent(postId)}`);
  }

  async editPost(updatedText: string): Promise<void> {
    await this.editButton.click();
    await this.editTextInput.fill(updatedText);
    await this.saveEditButton.click();
  }

  async deletePost(): Promise<void> {
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();
  }

  async addComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.submitCommentButton.click();
  }

  async submitEmptyComment(): Promise<void> {
    await this.commentInput.fill('');
    await this.submitCommentButton.click();
  }

  commentByText(text: string): Locator {
    return this.page
      .getByTestId('comment')
      .filter({ hasText: text })
      .or(this.page.getByText(text))
      .first();
  }

  deleteCommentButton(text: string): Locator {
    return this.commentByText(text)
      .getByTestId('comment-delete-button')
      .or(this.commentByText(text).getByRole('button', { name: /delete|remove/i }))
      .first();
  }

  async deleteComment(text: string): Promise<void> {
    await this.deleteCommentButton(text).click();
    await this.page
      .getByTestId('confirm-delete-comment')
      .or(this.page.getByRole('button', { name: /confirm|delete|remove/i }))
      .last()
      .click();
  }

  async expectPostText(text: string): Promise<void> {
    await expect(this.postContent).toContainText(text);
  }

  async expectEditedIndicator(): Promise<void> {
    await expect(this.page.getByTestId('post-edited-indicator').or(this.page.getByText(/edited/i)).first()).toBeVisible();
  }

  async expectCommentVisible(text: string): Promise<void> {
    await expect(this.commentByText(text)).toBeVisible();
  }

  async expectCommentRemoved(text: string): Promise<void> {
    await expect(this.commentByText(text)).toBeHidden();
  }

  async expectEmptyCommentValidation(): Promise<void> {
    await expect(this.commentValidationError).toBeVisible();
    await expect(this.commentValidationError).toContainText(/empty|required|comment/i);
  }

  async expectCannotDeleteComment(text: string): Promise<void> {
    await expect(this.deleteCommentButton(text)).toBeHidden();
  }

  async expectPostDeleted(): Promise<void> {
    await expect(
      this.deletionConfirmation
        .or(this.page.getByRole('status'))
        .or(this.page.getByText(/deleted|removed|success/i))
        .first(),
    ).toBeVisible();
  }
}
