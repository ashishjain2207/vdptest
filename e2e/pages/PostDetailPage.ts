import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoPost(postId: string): Promise<void> {
    await this.goto(`/posts/${encodeURIComponent(postId)}`);
  }

  async openActions(): Promise<void> {
    await this.page.getByRole('button', { name: /post actions/i }).first().click();
  }

  async editPost(updatedContent: string): Promise<void> {
    await this.openActions();
    await this.page.getByRole('menuitem', { name: /edit/i }).click();
    await this.page.getByRole('textbox', { name: /post content/i }).fill(updatedContent);
    await this.clickButton(/save/i);
    await this.expectToastOrInlineMessage(/updated|saved/i);
    await expect(this.page.getByText(updatedContent).first()).toBeVisible();
  }

  async expectEditActionUnavailable(): Promise<void> {
    const actions = this.page.getByRole('button', { name: /post actions/i }).first();
    if (!(await actions.isVisible().catch(() => false))) {
      return;
    }
    await actions.click();
    await expect(this.page.getByRole('menuitem', { name: /edit/i })).toHaveCount(0);
  }

  async deletePost(): Promise<void> {
    await this.openActions();
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
    await this.page.getByRole('button', { name: /^delete$/i }).click();
    await this.expectToastOrInlineMessage(/deleted/i);
  }

  async addComment(comment: string): Promise<void> {
    await this.page.getByRole('textbox', { name: /write a comment|comment/i }).first().fill(comment);
    await this.page.getByRole('button', { name: /^post$/i }).click();
    await this.expectToastOrInlineMessage(/comment posted|posted/i);
    await expect(this.page.getByText(comment).first()).toBeVisible();
  }

  async expectEmptyCommentRejected(): Promise<void> {
    const button = this.page.getByRole('button', { name: /^post$/i }).first();
    await expect(button).toBeDisabled();
  }

  async expectPostVisible(content: string): Promise<void> {
    await expect(this.page.getByText(content).first()).toBeVisible();
  }
}
