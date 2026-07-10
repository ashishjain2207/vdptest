import { expect, type Locator, type Page } from '@playwright/test';
import { clickFirst, fillFirst } from '../utils/locators';

export class PostDetailPage {
  constructor(private readonly page: Page) {}

  async gotoPost(postId: string): Promise<void> {
    await this.page.goto(`/posts/${encodeURIComponent(postId)}`);
  }

  private postContainerByText(contentSnippet: string): Locator {
    return this.page
      .locator('[data-testid="post-card"], [data-testid="post-detail"], article, [data-post-id]')
      .filter({ hasText: contentSnippet })
      .first();
  }

  async editPostByContent(originalText: string, updatedText: string): Promise<void> {
    const post = this.postContainerByText(originalText);
    await expect(post).toBeVisible();
    const actions = post.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
    if (await actions.count()) {
      await actions.click();
    }
    await clickFirst(this.page, ['[data-testid="post-edit-button"]', '[role="menuitem"]:has-text("Edit")', 'button:has-text("Edit")']);
    await fillFirst(this.page, ['[data-testid="post-edit-input"]', '[data-testid="post-textarea"]', 'textarea[name="content"]', 'textarea'], updatedText);
    await clickFirst(this.page, ['[data-testid="post-edit-save"]', 'button:has-text("Save")', 'button:has-text("Update")']);
  }

  async deletePostByContent(contentSnippet: string): Promise<void> {
    const post = this.postContainerByText(contentSnippet);
    await expect(post).toBeVisible();
    const actions = post.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
    if (await actions.count()) {
      await actions.click();
    }
    await clickFirst(this.page, ['[data-testid="post-delete-button"]', '[role="menuitem"]:has-text("Delete")', 'button:has-text("Delete")']);
    await clickFirst(this.page, ['[data-testid="confirm-delete"]', 'button:has-text("Confirm")', 'button:has-text("Delete")']);
  }

  async expectPostContent(content: string): Promise<void> {
    await expect(this.page.getByText(content)).toBeVisible();
  }

  async expectPostNotVisible(content: string): Promise<void> {
    await expect(this.page.getByText(content)).toHaveCount(0);
  }

  async addComment(text: string): Promise<void> {
    await fillFirst(this.page, ['[data-testid="comment-input"]', 'textarea[name="comment"]', 'textarea[placeholder*="comment"]'], text);
    await clickFirst(this.page, ['[data-testid="comment-submit"]', 'button:has-text("Add Comment")', 'button:has-text("Submit")']);
  }

  async expectCommentVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectCommentValidationError(): Promise<void> {
    await expect(this.page.getByText(/comment|required|empty/i)).toBeVisible();
  }

  async deleteOwnComment(text: string): Promise<void> {
    const comment = this.page
      .locator('[data-testid="comment-item"], [data-testid="comment-card"], article')
      .filter({ hasText: text })
      .first();
    await expect(comment).toBeVisible();
    const deleteButton = comment.locator('[data-testid="comment-delete"], button:has-text("Delete")').first();
    await deleteButton.click();

    const confirmDelete = this.page.locator('[data-testid="confirm-delete"], button:has-text("Confirm"), button:has-text("Delete")').first();
    if (await confirmDelete.count()) {
      await confirmDelete.click();
    }
  }

  async expectNoDeleteForForeignComment(text: string): Promise<void> {
    const comment = this.page
      .locator('[data-testid="comment-item"], [data-testid="comment-card"], article')
      .filter({ hasText: text })
      .first();
    await expect(comment).toBeVisible();
    await expect(comment.locator('[data-testid="comment-delete"], button:has-text("Delete")')).toHaveCount(0);
  }
}
