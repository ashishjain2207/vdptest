import { expect, Locator, Page } from '@playwright/test';

type CreatePostInput = {
  text?: string;
  visibility?: string;
  mediaPath?: string;
};

export class CreatePostPage {
  readonly page: Page;
  readonly composer: Locator;
  readonly textInput: Locator;
  readonly visibilitySelect: Locator;
  readonly mediaInput: Locator;
  readonly submitButton: Locator;
  readonly validationError: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.composer = page.getByTestId('post-composer').or(page.getByRole('dialog')).first();
    this.textInput = page
      .getByTestId('post-text-input')
      .or(page.getByLabel(/post|what.*mind|text/i))
      .or(page.getByPlaceholder(/what.*mind|write|post/i))
      .first();
    this.visibilitySelect = page
      .getByTestId('post-visibility')
      .or(page.getByLabel(/visibility|audience/i))
      .first();
    this.mediaInput = page
      .getByTestId('post-media-input')
      .or(page.locator('input[type="file"][name*="media" i]'))
      .or(page.locator('input[type="file"]').first());
    this.submitButton = page
      .getByTestId('post-submit')
      .or(page.getByRole('button', { name: /^post$|publish|submit/i }))
      .first();
    this.validationError = page
      .getByTestId('post-validation-error')
      .or(page.getByRole('alert'))
      .or(page.getByText(/cannot be empty|required|unsupported|file type|validation/i))
      .first();
    this.successMessage = page
      .getByTestId('post-success')
      .or(page.getByText(/post created|posted successfully|success/i))
      .first();
  }

  async gotoFromFeed(): Promise<void> {
    await this.page.goto('/posts');
    await this.page
      .getByTestId('create-post-button')
      .or(this.page.getByRole('button', { name: /create post|new post|post/i }))
      .first()
      .click();
  }

  async fillPost({ text, visibility, mediaPath }: CreatePostInput): Promise<void> {
    if (text !== undefined) {
      await this.textInput.fill(text);
    }

    if (visibility) {
      await this.visibilitySelect.selectOption({ label: visibility }).catch(async () => {
        await this.visibilitySelect.click();
        await this.page.getByRole('option', { name: new RegExp(visibility, 'i') }).click();
      });
    }

    if (mediaPath) {
      await this.mediaInput.setInputFiles(mediaPath);
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async createTextPost(text: string, visibility = 'Public'): Promise<void> {
    await this.fillPost({ text, visibility });
    await this.submit();
  }

  async expectPostCreated(text: string): Promise<void> {
    await expect(
      this.successMessage.or(this.page.getByTestId('post-card').filter({ hasText: text })).first(),
    ).toBeVisible();
  }

  async expectValidationError(expectedText: RegExp): Promise<void> {
    await expect(this.validationError).toBeVisible();
    await expect(this.validationError).toContainText(expectedText);
  }

  async expectOnCreatePost(): Promise<void> {
    await expect(this.composer.or(this.textInput).first()).toBeVisible();
  }
}
