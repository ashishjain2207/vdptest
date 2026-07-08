import { expect, type Locator, type Page } from '@playwright/test';

export class CreatePostPage {
  constructor(private readonly page: Page) {}

  private first(...locators: Locator[]): Locator {
    return locators.reduce((current, next) => current.or(next)).first();
  }

  contentField(): Locator {
    return this.first(
      this.page.getByTestId('create-post-content'),
      this.page.getByLabel(/post content/i),
      this.page.getByPlaceholder(/what would you like to share/i),
    );
  }

  submitButton(): Locator {
    return this.first(
      this.page.getByTestId('create-post-submit'),
      this.page.getByRole('button', { name: /publish|post/i }),
    );
  }

  attachmentInput(): Locator {
    return this.page.locator('input[type="file"]').first();
  }

  validationToast(): Locator {
    return this.first(
      this.page.getByTestId('create-post-error'),
      this.page.getByText(/not an allowed file type|post.*empty|add text|unsupported/i),
    );
  }

  async fillContent(content: string): Promise<void> {
    await this.contentField().fill(content);
  }

  async selectVisibilityIfAvailable(_visibility: string): Promise<void> {
    // The current application publishes directly without a visibility picker.
  }

  async uploadMedia(filePath: string): Promise<void> {
    await this.attachmentInput().setInputFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton().click();
  }

  async expectEmptyPostBlocked(): Promise<void> {
    await expect(this.submitButton()).toBeDisabled();
  }

  async expectUnsupportedFileError(): Promise<void> {
    await expect(this.validationToast()).toBeVisible();
  }
}
