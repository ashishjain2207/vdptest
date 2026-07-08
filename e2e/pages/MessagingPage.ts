import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MessagingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoMessages(userId?: string): Promise<void> {
    await this.goto(userId ? `/messages/${encodeURIComponent(userId)}` : '/messages');
  }

  async startNewMessage(): Promise<void> {
    await this.page.getByRole('button', { name: /new message/i }).first().click();
  }

  async selectRecipient(search: string): Promise<void> {
    await this.page.getByLabel(/search connections/i).fill(search);
    await this.page.getByText(search).first().click();
  }

  async sendMessage(message: string): Promise<void> {
    await this.page.getByRole('textbox', { name: /message/i }).or(this.page.getByPlaceholder(/type a message|write your message/i)).first().fill(message);
    await this.page.getByRole('button', { name: /send message/i }).click();
    await expect(this.page.getByText(message).first()).toBeVisible();
  }

  async expectGuestCannotSendMessages(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?.*)?$/);
  }
}
