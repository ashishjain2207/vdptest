import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CreatePostPage extends BasePage {
  readonly composerInput: Locator;
  readonly submitButton: Locator;
  readonly mediaInput: Locator;

  constructor(page: Page) {
    super(page);
    this.composerInput = this.byTestIdOr(
      'post-composer-input',
      page.getByRole('textbox', { name: /post content|share|what/i }).first(),
    );
    this.submitButton = this.byTestIdOr(
      'post-composer-submit-button',
      page.getByRole('button', { name: /^post$|publish|share/i }).first(),
    );
    this.mediaInput = page.getByTestId('post-media-upload-input').or(page.locator('input[type="file"]').first());
  }

  async createTextPost(content: string): Promise<void> {
    await this.composerInput.fill(content);
    await this.submitButton.click();
    await expect(this.page.getByText(content).first()).toBeVisible();
  }

  async uploadUnsupportedMedia(filePath: string): Promise<void> {
    await this.mediaInput.setInputFiles(filePath);
  }

  async expectUnsupportedMediaValidation(): Promise<void> {
    await expect(
      this.page
        .getByRole('alert')
        .or(this.page.getByText(/unsupported|not allowed|invalid file|file type/i))
        .first(),
    ).toBeVisible();
  }
}
