import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CreatePostPage extends BasePage {
  async goTo(): Promise<void> {
    await this.goto('/posts');
    await expect(this.composer()).toBeVisible();
  }

  composer() {
    return this.locatorAny(
      this.page.getByTestId('post-composer'),
      this.page.getByPlaceholder(/what.*mind|share.*update|write.*post/i),
      this.page.getByRole('textbox', { name: /post content|create post|what.*mind/i }),
    );
  }

  async enterPostText(text: string): Promise<void> {
    await this.composer().fill(text);
  }

  async selectVisibility(visibility: string): Promise<void> {
    const visibilityControl = this.locatorAny(
      this.page.getByTestId('post-visibility'),
      this.page.getByRole('button', { name: /visibility|public|connections/i }),
    );

    if ((await visibilityControl.count()) > 0 && await visibilityControl.isVisible().catch(() => false)) {
      await visibilityControl.click();
      await this.page.getByRole('option', { name: new RegExp(visibility, 'i') }).click();
    }
  }

  async submitPost(): Promise<void> {
    await this.byTestIdOrRole('post-submit', 'button', /^post$|publish|share/i).click();
  }

  async createTextPost(text: string, visibility = 'Public'): Promise<void> {
    await this.goTo();
    await this.enterPostText(text);
    await this.selectVisibility(visibility);
    await this.submitPost();
    await this.expectPostSubmitted(text);
  }

  async uploadMedia(filePath: string): Promise<void> {
    await this.locatorAny(
      this.page.getByTestId('post-media-upload'),
      this.page.locator('input[type="file"]').first(),
    ).setInputFiles(filePath);
  }

  async expectUnsupportedMediaValidation(): Promise<void> {
    await this.expectToastOrInlineMessage(/unsupported|file type|invalid file|not allowed/i);
  }

  async expectPostSubmitted(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
    await this.expectNoValidationErrors();
  }
}
