import { expect, type Locator, type Page } from '@playwright/test';

export class CreatePostPage {
  readonly page: Page;
  readonly composer: Locator;
  readonly contentInput: Locator;
  readonly attachButton: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;
  readonly pollButton: Locator;
  readonly locationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.composer = page.getByTestId('create-post-composer');
    this.contentInput = page.getByTestId('create-post-content-input');
    this.attachButton = page.getByTestId('create-post-attach-button');
    this.fileInput = page.getByTestId('create-post-file-input');
    this.submitButton = page.getByTestId('create-post-submit-button');
    this.pollButton = page.getByTestId('create-post-poll-button');
    this.locationButton = page.getByTestId('create-post-location-button');
  }

  async expectVisible(): Promise<void> {
    await expect(this.composer).toBeVisible();
  }

  async publishTextPost(content: string): Promise<void> {
    await this.contentInput.fill(content);
    await this.submitButton.click();
  }

  async uploadUnsupportedMedia(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  emptyPostValidation(): Locator {
    return this.page.locator('text=/couldn.t be published|cannot be empty|required/i').first();
  }

  unsupportedMediaValidation(): Locator {
    return this.page.locator('text=/unsupported|file type|image file|upload/i').first();
  }
}
