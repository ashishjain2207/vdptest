import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostDetailPage extends BasePage {
  readonly actionsButton: Locator;
  readonly commentInput: Locator;
  readonly commentSubmitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.actionsButton = this.byTestIdOr('post-actions-button', page.getByRole('button', { name: /post actions|more/i }).first());
    this.commentInput = this.byTestIdOr(
      'comment-input',
      page.getByRole('textbox', { name: /comment/i }).or(page.getByPlaceholder(/comment/i)).first(),
    );
    this.commentSubmitButton = this.byTestIdOr(
      'comment-submit-button',
      page.getByRole('button', { name: /comment|reply|post/i }).first(),
    );
  }

  async open(path: string): Promise<void> {
    await this.goto(path);
  }

  async openEditDialog(): Promise<void> {
    await this.actionsButton.click();
    await this.page.getByRole('menuitem', { name: /edit/i }).or(this.page.getByRole('button', { name: /edit/i })).first().click();
  }

  async editPost(updatedContent: string): Promise<void> {
    await this.openEditDialog();
    const editor = this.byTestIdOr(
      'edit-post-content-input',
      this.page.getByRole('textbox', { name: /post content/i }).first(),
    );
    await editor.fill(updatedContent);
    await this.page.getByRole('button', { name: /save|update/i }).click();
    await expect(this.page.getByText(updatedContent).first()).toBeVisible();
  }

  async expectCannotEditPost(): Promise<void> {
    await expect(
      this.page
        .getByRole('menuitem', { name: /edit/i })
        .or(this.page.getByRole('button', { name: /^edit$/i })),
    ).toHaveCount(0);
  }

  async deletePost(): Promise<void> {
    await this.actionsButton.click();
    await this.page.getByRole('menuitem', { name: /delete|remove/i }).or(this.page.getByRole('button', { name: /delete|remove/i })).first().click();
    await this.page.getByRole('button', { name: /confirm|delete|remove/i }).last().click();
  }

  async addComment(comment: string): Promise<void> {
    await this.commentInput.fill(comment);
    await this.commentSubmitButton.click();
    await expect(this.page.getByText(comment).first()).toBeVisible();
  }

  async submitEmptyComment(): Promise<void> {
    await this.commentInput.fill('');
    await this.commentSubmitButton.click();
  }

  async expectEmptyCommentValidation(): Promise<void> {
    await expect(
      this.page
        .getByRole('alert')
        .or(this.page.getByText(/comment.*required|enter.*comment|empty/i))
        .first(),
    ).toBeVisible();
  }
}
