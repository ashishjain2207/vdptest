import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class CreatePostPage {
  readonly page: Page;
  readonly form: Locator;
  readonly contentInput: Locator;
  readonly fileInput: Locator;
  readonly addMediaButton: Locator;
  readonly submitButton: Locator;
  readonly moderationError: Locator;
  readonly editModal: Locator;
  readonly editContentInput: Locator;
  readonly editSaveButton: Locator;
  readonly deleteDialog: Locator;
  readonly deleteConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('create-post-form');
    this.contentInput = page.getByTestId('create-post-content-input');
    this.fileInput = page.getByTestId('create-post-file-input');
    this.addMediaButton = page.getByTestId('create-post-add-media');
    this.submitButton = page.getByTestId('create-post-submit');
    this.moderationError = page.getByTestId('create-post-moderation-error');
    this.editModal = page.getByTestId('edit-post-modal');
    this.editContentInput = page.getByTestId('edit-post-content-input');
    this.editSaveButton = page.getByTestId('edit-post-save');
    this.deleteDialog = page.getByTestId('delete-post-dialog');
    this.deleteConfirmButton = page.getByTestId('delete-post-confirm');
  }

  async expectComposerVisible(): Promise<void> {
    await expect(this.form).toBeVisible();
  }

  async fillContent(content: string): Promise<void> {
    await this.contentInput.fill(content);
  }

  async attachFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async createTextPost(content: string): Promise<void> {
    await this.fillContent(content);
    await this.submit();
  }

  async expectModerationErrorVisible(): Promise<void> {
    await expect(this.moderationError).toBeVisible();
  }

  async fillEditModalContent(content: string): Promise<void> {
    await expect(this.editModal).toBeVisible();
    await this.editContentInput.fill(content);
  }

  async saveEditedPost(): Promise<void> {
    await this.editSaveButton.click();
    await expect(this.editModal).toBeHidden();
  }

  async confirmDelete(): Promise<void> {
    await expect(this.deleteDialog).toBeVisible();
    await this.deleteConfirmButton.click();
  }
}
