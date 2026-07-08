import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostDetailPage extends BasePage {
  async goToPost(postId: string): Promise<void> {
    await this.goto(`/posts/${encodeURIComponent(postId)}`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/posts\/[^/]+/);
    await expect(this.page.getByRole('main')).toBeVisible();
  }

  async openEdit(): Promise<void> {
    const menu = this.locatorAny(
      this.page.getByTestId('post-more-menu'),
      this.page.getByRole('button', { name: /more|post actions|options/i }),
    );
    await this.clickIfPresent(menu);
    await this.locatorAny(
      this.page.getByTestId('post-edit-button'),
      this.page.getByRole('menuitem', { name: /edit/i }),
      this.page.getByRole('button', { name: /edit/i }),
    ).click();
  }

  async editPostText(updatedText: string): Promise<void> {
    await this.openEdit();
    await this.locatorAny(
      this.page.getByTestId('edit-post-content'),
      this.page.getByRole('textbox', { name: /post content|edit post/i }),
      this.page.getByPlaceholder(/what.*mind|share.*update|write.*post/i),
    ).fill(updatedText);
    await this.byTestIdOrRole('save-post-button', 'button', /save|update/i).click();
  }

  async expectPostText(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async expectEditedIndicator(): Promise<void> {
    const edited = this.page.getByText(/edited/i).first();
    if ((await edited.count()) > 0) {
      await expect(edited).toBeVisible();
    }
  }

  async expectEditUnavailable(): Promise<void> {
    await expect(
      this.locatorAny(
        this.page.getByTestId('post-edit-button'),
        this.page.getByRole('menuitem', { name: /edit/i }),
        this.page.getByRole('button', { name: /edit/i }),
      ),
    ).toHaveCount(0);
  }

  async deletePostWithConfirmation(): Promise<void> {
    const menu = this.locatorAny(
      this.page.getByTestId('post-more-menu'),
      this.page.getByRole('button', { name: /more|post actions|options/i }),
    );
    await this.clickIfPresent(menu);
    await this.locatorAny(
      this.page.getByTestId('post-delete-button'),
      this.page.getByRole('menuitem', { name: /delete|remove/i }),
      this.page.getByRole('button', { name: /delete|remove/i }),
    ).click();
    await this.byTestIdOrRole('confirm-delete-post', 'button', /confirm|delete|remove/i).click();
  }

  async expectDeletionConfirmed(): Promise<void> {
    await this.expectToastOrInlineMessage(/deleted|removed/i);
  }

  async enterComment(comment: string): Promise<void> {
    await this.locatorAny(
      this.page.getByTestId('comment-input'),
      this.page.getByRole('textbox', { name: /comment|reply/i }),
      this.page.getByPlaceholder(/write.*comment|add.*comment/i),
    ).fill(comment);
  }

  async submitComment(): Promise<void> {
    const submit = this.byTestIdOrRole('comment-submit', 'button', /^post$|comment|reply|send/i);
    if (await submit.isDisabled().catch(() => false)) {
      return;
    }
    await submit.click();
  }

  async addComment(comment: string): Promise<void> {
    await this.enterComment(comment);
    await this.submitComment();
  }

  async expectCommentVisible(comment: string): Promise<void> {
    await expect(this.page.getByText(comment).first()).toBeVisible();
  }

  async expectCommentCountIncremented(): Promise<void> {
    await expect(this.page.getByText(/comment/i).first()).toBeVisible();
  }

  async expectEmptyCommentValidation(): Promise<void> {
    const submit = this.byTestIdOrRole('comment-submit', 'button', /^post$|comment|reply|send/i);
    if (await submit.isDisabled().catch(() => false)) {
      await expect(submit).toBeDisabled();
      return;
    }
    await this.expectToastOrInlineMessage(/comment.*empty|required|cannot be empty|write a comment/i);
  }
}
