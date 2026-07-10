import { expect, type Page } from '@playwright/test';
import { clickFirst, fillFirst } from '../utils/locators';

export class CreatePostPage {
  constructor(private readonly page: Page) {}

  async openComposer(): Promise<void> {
    const button = this.page.getByRole('button', { name: /create post|what's on your mind|post/i }).first();
    if (await button.count()) {
      await button.click();
      return;
    }
    await clickFirst(this.page, ['[data-testid="create-post-trigger"]', '[data-testid="post-create-button"]']);
  }

  async enterPostText(content: string): Promise<void> {
    await fillFirst(
      this.page,
      ['[data-testid="create-post-input"]', '[data-testid="post-textarea"]', 'textarea[name="content"]', 'textarea'],
      content,
    );
  }

  async selectVisibility(label: string): Promise<void> {
    const visibilityButton = this.page.getByRole('button', { name: /visibility|public|private|followers/i }).first();
    if (await visibilityButton.count()) {
      await visibilityButton.click();
      await this.page.getByRole('option', { name: new RegExp(label, 'i') }).first().click();
    }
  }

  async uploadUnsupportedMedia(fileName = 'invalid-file.exe'): Promise<void> {
    const input = this.page
      .locator('[data-testid="post-media-upload"], input[type="file"][accept], input[type="file"]')
      .first();
    await input.setInputFiles({
      name: fileName,
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('this is not a supported media payload'),
    });
  }

  async submit(): Promise<void> {
    const postButton = this.page.getByRole('button', { name: /^post$/i }).first();
    if (await postButton.count()) {
      await postButton.click();
      return;
    }
    await clickFirst(this.page, ['[data-testid="create-post-submit"]', '[data-testid="post-submit"]', 'button[type="submit"]']);
  }

  async expectPostVisible(content: string): Promise<void> {
    await expect(this.page.getByText(content)).toBeVisible();
  }

  async expectEmptyPostValidationError(): Promise<void> {
    await expect(this.page.getByText(/empty|required|cannot be empty|add text/i)).toBeVisible();
  }

  async expectUnsupportedMediaError(): Promise<void> {
    await expect(this.page.getByText(/unsupported|invalid file|file type|format/i)).toBeVisible();
  }
}
