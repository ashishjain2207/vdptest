import { expect, type Locator, type Page } from '@playwright/test';

export class FeedComposerPage {
  constructor(private readonly page: Page) {}

  get contentInput(): Locator {
    return this.page.getByLabel('Post content', { exact: true });
  }

  get publishButton(): Locator {
    return this.page.getByRole('button', { name: 'Publish', exact: true });
  }

  get successToast(): Locator {
    return this.page.getByText('Post published.', { exact: true });
  }

  async openComposer(): Promise<void> {
    await this.contentInput.click();
    await expect(this.contentInput).toBeFocused();
  }

  async enterText(text: string): Promise<void> {
    await this.contentInput.fill(text);
  }

  async publish(): Promise<void> {
    await this.publishButton.click();
  }
}
