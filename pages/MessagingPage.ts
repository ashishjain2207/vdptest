import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MessagingPage extends BasePage {
  readonly composerInput: Locator;
  readonly sendButton: Locator;

  constructor(page: Page) {
    super(page);
    this.composerInput = this.byTestIdOr(
      'message-composer-input',
      page.getByRole('textbox', { name: /message/i }).or(page.getByPlaceholder(/message/i)).first(),
    );
    this.sendButton = this.byTestIdOr('message-send-button', page.getByRole('button', { name: /send/i }).first());
  }

  async open(): Promise<void> {
    await this.goto('/messages');
  }

  async sendMessage(message: string): Promise<void> {
    await this.composerInput.fill(message);
    await this.sendButton.click();
  }

  async expectMessageDelivered(message: string | RegExp): Promise<void> {
    await expect(this.page.getByText(message).first()).toBeVisible();
  }
}
