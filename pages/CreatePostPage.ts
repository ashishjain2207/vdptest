import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class CreatePostPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get composerInput(): Locator {
    return this.byTestId('post-composer-input')
      .or(this.page.getByRole('textbox', { name: /post content/i }))
      .or(this.page.getByPlaceholder(/what would you like to share/i))
      .first();
  }

  get publishButton(): Locator {
    return this.byTestId('post-publish').or(this.page.getByRole('button', { name: /^publish$/i })).first();
  }

  get mediaInput(): Locator {
    return this.byTestId('post-media-input').or(this.page.locator('input[type="file"]').first());
  }

  async gotoComposer(): Promise<void> {
    await this.goto(routes.feed);
    await expect(this.composerInput).toBeVisible();
  }

  async createTextPost(content: string): Promise<void> {
    await this.composerInput.fill(content);
    await this.publishButton.click();
  }

  async uploadMedia(filePath: string): Promise<void> {
    await this.mediaInput.setInputFiles(filePath);
  }

  async expectPostSubmitted(content: string): Promise<void> {
    await expect(this.page.getByText(content).first()).toBeVisible();
  }

  async expectUnsupportedMediaValidation(): Promise<void> {
    await expect(this.page.getByText(/unsupported|not supported|invalid file type|file type/i).first()).toBeVisible();
  }
}
