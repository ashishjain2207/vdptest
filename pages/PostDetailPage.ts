import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class PostDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get postActionsButton(): Locator {
    return this.byTestId('post-actions').or(this.page.getByRole('button', { name: /post actions|more/i })).first();
  }

  get editMenuItem(): Locator {
    return this.byTestId('post-edit').or(this.page.getByRole('menuitem', { name: /^edit$/i })).first();
  }

  get deleteMenuItem(): Locator {
    return this.byTestId('post-delete').or(this.page.getByRole('menuitem', { name: /^delete$/i })).first();
  }

  get editContentInput(): Locator {
    return this.byTestId('post-edit-content')
      .or(this.page.getByRole('textbox', { name: /post content|content/i }))
      .or(this.page.locator('textarea').first());
  }

  get saveEditButton(): Locator {
    return this.byTestId('post-edit-save').or(this.page.getByRole('button', { name: /^save$|save changes/i })).first();
  }

  get confirmDeleteButton(): Locator {
    return this.byTestId('post-delete-confirm').or(this.page.getByRole('button', { name: /^delete$/i })).last();
  }

  get commentInput(): Locator {
    return this.byTestId('comment-input').or(this.page.getByPlaceholder(/write a comment/i)).or(this.page.getByRole('textbox', { name: /comment/i })).first();
  }

  get commentSubmitButton(): Locator {
    return this.byTestId('comment-submit').or(this.page.getByRole('button', { name: /^post$|comment/i })).first();
  }

  async gotoPost(postId: string): Promise<void> {
    await this.goto(routes.post(postId));
  }

  async openActionsMenu(): Promise<void> {
    await this.postActionsButton.click();
  }

  async openEditPost(): Promise<void> {
    await this.openActionsMenu();
    await this.editMenuItem.click();
    await expect(this.editContentInput).toBeVisible();
  }

  async editPostContent(updatedContent: string): Promise<void> {
    await this.openEditPost();
    await this.editContentInput.fill(updatedContent);
    await this.saveEditButton.click();
  }

  async expectPostContent(content: string): Promise<void> {
    await expect(this.page.getByText(content).first()).toBeVisible();
  }

  async expectEditUnavailable(): Promise<void> {
    await this.openActionsMenu();
    await expect(this.editMenuItem).toHaveCount(0);
  }

  async deletePostWithConfirmation(): Promise<void> {
    await this.openActionsMenu();
    await this.deleteMenuItem.click();
    await this.confirmDeleteButton.click();
  }

  async addComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.commentSubmitButton.click();
  }

  async submitEmptyComment(): Promise<void> {
    await this.commentInput.fill('');
    await this.commentSubmitButton.click();
  }

  async expectCommentVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async expectEmptyCommentValidation(): Promise<void> {
    await expect(this.page.getByText(/comment.*required|enter a comment|cannot be empty|write a comment/i).first()).toBeVisible();
  }
}
