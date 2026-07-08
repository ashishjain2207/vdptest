import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CreatePostPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  composer(): ReturnType<Page['getByRole']> {
    return this.page.getByRole('textbox', { name: /post content|share/i }).first();
  }

  async createTextPost(content: string): Promise<void> {
    await this.composer().fill(content);
    await this.clickButton(/publish|post/i);
    await this.expectToastOrInlineMessage(/published|post created|success/i);
    await expect(this.page.getByText(content).first()).toBeVisible();
  }

  async uploadUnsupportedMedia(filePath: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
  }

  async expectUnsupportedMediaRejected(): Promise<void> {
    await this.expectToastOrInlineMessage(/unsupported|invalid|not allowed|file type|media/i);
  }

  async expectPublishDisabledForEmptyComposer(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /publish|post/i }).first()).toBeDisabled();
  }
}
