import { expect, Locator, Page } from '@playwright/test';

export type FilePayload = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

export class FeedComposerPage {
  constructor(private readonly page: Page) {}

  readonly contentInput = this.page.getByRole('textbox', { name: 'Post content' }).first();

  private composerRoot(): Locator {
    return this.contentInput.locator('xpath=ancestor::form[1]');
  }

  readonly publishButton = this.page.getByRole('button', { name: 'Publish' }).first();
  readonly addImageButton = this.page.getByRole('button', { name: 'Add image' }).first();
  readonly addLinkButton = this.page.getByRole('button', { name: 'Add link' }).first();
  readonly createPollButton = this.page.getByRole('button', { name: 'Create poll' }).first();
  readonly addLocationButton = this.page.getByRole('button', { name: 'Add location' }).first();
  readonly hiddenFileInput = this.page.locator('input[type="file"][aria-label="Add image"]').first();

  async goto(): Promise<void> {
    await this.page.goto('/posts');
    await this.expectReady();
  }

  async expectReady(): Promise<void> {
    await expect(this.contentInput).toBeVisible();
    await expect(this.publishButton).toBeVisible();
  }

  async fillContent(text: string): Promise<void> {
    await this.contentInput.fill(text);
  }

  async attachMedia(file: FilePayload): Promise<void> {
    await this.hiddenFileInput.setInputFiles(file);
  }

  async applyImageCropIfVisible(): Promise<void> {
    const applyButton = this.page.getByRole('button', { name: 'Apply' });
    const isVisible = await applyButton.isVisible().catch(() => false);
    if (isVisible) {
      await applyButton.click();
      await expect(applyButton).toBeHidden();
    }
  }

  async addLink(url: string): Promise<void> {
    await this.addLinkButton.click();
    const linkInput = this.page.getByRole('textbox', { name: 'Link URL' });
    await expect(linkInput).toBeVisible();
    await linkInput.fill(url);
    await linkInput.press('Enter');
  }

  async addPoll(question: string, options: [string, string]): Promise<void> {
    await this.createPollButton.click();
    await this.page.getByRole('textbox', { name: 'Poll question' }).fill(question);
    await this.page.getByRole('textbox', { name: 'Poll option 1' }).fill(options[0]);
    await this.page.getByRole('textbox', { name: 'Poll option 2' }).fill(options[1]);
  }

  async addManualLocation(locationLabel: string): Promise<void> {
    await this.addLocationButton.click();
    const locationInput = this.page.getByRole('textbox', { name: 'Search for a location' });
    await expect(locationInput).toBeVisible();
    await locationInput.fill(locationLabel);
    await this.page.getByRole('button', { name: 'Use this location' }).click();
  }

  async publish(): Promise<void> {
    await this.publishButton.click();
  }

  async expectPublishEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await expect(this.publishButton).toBeEnabled();
      return;
    }
    await expect(this.publishButton).toBeDisabled();
  }

  async expectComposerCleared(): Promise<void> {
    await expect(this.contentInput).toHaveValue('');
    await expect(this.composerRoot().getByRole('button', { name: 'Remove link' })).toHaveCount(0);
    await expect(this.composerRoot().getByRole('button', { name: 'Remove location' })).toHaveCount(0);
  }

  async expectMediaPreviewVisible(): Promise<void> {
    await expect(this.composerRoot().getByRole('button', { name: 'Remove' })).toBeVisible();
  }

  async expectLinkCardVisible(urlText: string): Promise<void> {
    await expect(this.composerRoot().getByRole('button', { name: 'Remove link' })).toBeVisible();
    await expect(this.composerRoot().getByText(urlText, { exact: false })).toBeVisible();
  }

  async expectLocationCardVisible(locationText: string): Promise<void> {
    await expect(this.composerRoot().getByRole('button', { name: 'Remove location' })).toBeVisible();
    await expect(this.composerRoot().getByText(`📍 ${locationText}`)).toBeVisible();
  }
}
