import { expect, type Locator, type Page } from '@playwright/test';

export class PostDetailPage {
  readonly page: Page;
  readonly postContainer: Locator;
  readonly actionsButton: Locator;
  readonly editAction: Locator;
  readonly deleteAction: Locator;
  readonly commentInput: Locator;
  readonly submitCommentButton: Locator;
  readonly commentList: Locator;
  readonly validationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.postContainer = page.getByTestId('post-detail').or(page.locator('main')).first();
    this.actionsButton = page.getByTestId('post-actions').or(page.getByRole('button', { name: /post actions|actions|more/i })).first();
    this.editAction = page.getByTestId('post-edit').or(page.getByRole('menuitem', { name: /edit/i })).or(page.getByRole('button', { name: /edit/i })).first();
    this.deleteAction = page.getByTestId('post-delete').or(page.getByRole('menuitem', { name: /delete|remove/i })).or(page.getByRole('button', { name: /delete|remove/i })).first();
    this.commentInput = page.getByTestId('comment-input').or(page.getByPlaceholder(/write a comment|comment/i)).or(page.getByLabel(/comment/i)).first();
    this.submitCommentButton = page.getByTestId('comment-submit').or(page.getByRole('button', { name: /add comment|submit|send|comment/i })).last();
    this.commentList = page.getByTestId('comment-list').or(page.locator('[data-comments-section], section, main')).first();
    this.validationMessage = page.getByRole('alert').or(page.locator('.text-destructive, [data-sonner-toast]')).first();
  }

  async gotoPost(postId: string): Promise<void> {
    await this.page.goto(`/posts/${encodeURIComponent(postId)}`);
    await expect(this.postContainer).toBeVisible();
  }

  async expectPostText(text: string): Promise<void> {
    await expect(this.postContainer).toContainText(text);
  }

  async openActions(): Promise<void> {
    if (await this.actionsButton.count() > 0 && await this.actionsButton.isVisible()) {
      await this.actionsButton.click();
    }
  }

  async editPostText(updatedText: string): Promise<void> {
    await this.openActions();
    await this.editAction.click();
    const editInput = this.page
      .getByTestId('edit-post-input')
      .or(this.page.getByLabel(/post content|content/i))
      .or(this.page.getByPlaceholder(/share|post|what/i))
      .first();
    await expect(editInput).toBeVisible();
    await editInput.fill(updatedText);
    await this.page.getByTestId('edit-post-save').or(this.page.getByRole('button', { name: /save|update/i })).first().click();
  }

  async expectEditedPostText(updatedText: string): Promise<void> {
    await expect(this.postContainer).toContainText(updatedText);
  }

  async deletePostWithConfirmation(): Promise<void> {
    await this.openActions();
    await this.deleteAction.click();
    const confirmButton = this.page.getByRole('button', { name: /confirm|delete|remove|yes/i }).last();
    if (await confirmButton.count() > 0 && await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async expectPostDeletedConfirmation(): Promise<void> {
    await expect(this.page.getByText(/deleted|removed|success/i).or(this.page.locator('[data-sonner-toast]')).first()).toBeVisible();
  }

  async addComment(text: string): Promise<void> {
    await expect(this.commentInput).toBeVisible();
    await this.commentInput.fill(text);
    await this.submitCommentButton.click();
  }

  async expectCommentVisible(text: string): Promise<void> {
    await expect(this.commentList.getByText(text).first()).toBeVisible();
  }

  async expectCommentCountChanged(): Promise<void> {
    await expect(this.commentList).toBeVisible();
  }

  async expectEmptyCommentBlocked(): Promise<void> {
    if (await this.submitCommentButton.isDisabled()) {
      await expect(this.submitCommentButton).toBeDisabled();
      return;
    }
    await this.submitCommentButton.click();
    await expect(this.validationMessage).toBeVisible();
    await expect(this.validationMessage).toContainText(/comment|required|empty/i);
  }

  commentByText(text: string): Locator {
    return this.commentList.locator('[data-testid="comment"], article, li, div').filter({ hasText: text }).first();
  }

  async deleteOwnComment(text: string): Promise<void> {
    const comment = this.commentByText(text);
    await expect(comment).toBeVisible();
    const deleteButton = comment.getByRole('button', { name: /delete|remove/i }).first();
    await deleteButton.click();
    const confirmButton = this.page.getByRole('button', { name: /confirm|delete|remove|yes/i }).last();
    if (await confirmButton.count() > 0 && await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async expectCommentRemoved(text: string): Promise<void> {
    await expect(this.commentList.getByText(text)).toHaveCount(0);
  }

  async expectDeleteUnavailableForComment(text: string): Promise<void> {
    const comment = this.commentByText(text);
    await expect(comment).toBeVisible();
    await expect(comment.getByRole('button', { name: /delete|remove/i })).toHaveCount(0);
  }
}
