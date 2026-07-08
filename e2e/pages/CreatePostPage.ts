import { expect, type Locator, type Page } from '@playwright/test';

async function setIfVisible(locator: Locator, value: string): Promise<void> {
  if (await locator.count() > 0 && await locator.first().isVisible()) {
    await locator.first().fill(value);
  }
}

export class CreatePostPage {
  readonly page: Page;
  readonly composerInput: Locator;
  readonly mediaInput: Locator;
  readonly visibilitySelect: Locator;
  readonly submitButton: Locator;
  readonly validationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.composerInput = page
      .getByTestId('post-composer-input')
      .or(page.getByLabel(/post content/i))
      .or(page.getByPlaceholder(/share|post|what/i))
      .first();
    this.mediaInput = page
      .getByTestId('post-media-input')
      .or(page.getByLabel(/add image|media|attachment/i))
      .or(page.locator('input[type="file"]'))
      .first();
    this.visibilitySelect = page.getByTestId('post-visibility').or(page.getByLabel(/visibility|audience/i)).first();
    this.submitButton = page.getByTestId('post-submit').or(page.getByRole('button', { name: /post|publish/i })).last();
    this.validationMessage = page.getByRole('alert').or(page.locator('.text-destructive, [data-sonner-toast]')).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/posts');
    await expect(this.composerInput).toBeVisible();
  }

  async enterText(text: string): Promise<void> {
    await this.composerInput.fill(text);
  }

  async selectVisibility(label: string): Promise<void> {
    if (await this.visibilitySelect.count() === 0 || !await this.visibilitySelect.isVisible()) {
      return;
    }
    await this.visibilitySelect.click();
    await this.page.getByRole('option', { name: new RegExp(label, 'i') }).click();
  }

  async uploadMedia(filePath: string): Promise<void> {
    await this.mediaInput.setInputFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async createTextPost(text: string, visibility = 'Public'): Promise<void> {
    await this.enterText(text);
    await this.selectVisibility(visibility);
    await this.submit();
  }

  async expectPostCreated(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
    await expect(this.validationMessage).toBeHidden();
  }

  async expectEmptyPostBlocked(): Promise<void> {
    if (await this.submitButton.isDisabled()) {
      await expect(this.submitButton).toBeDisabled();
      return;
    }
    await this.submit();
    await expect(this.validationMessage).toBeVisible();
    await expect(this.validationMessage).toContainText(/empty|required|content|media/i);
  }

  async expectUnsupportedMediaBlocked(expectedMessage?: string): Promise<void> {
    await this.submit();
    await expect(this.validationMessage).toBeVisible();
    await expect(this.validationMessage).toContainText(new RegExp(expectedMessage ?? 'unsupported|file type|format|media', 'i'));
  }

  async fillLinkIfPresent(url: string): Promise<void> {
    await setIfVisible(this.page.getByLabel(/link url|url/i).or(this.page.getByPlaceholder(/url/i)).first(), url);
  }
}
