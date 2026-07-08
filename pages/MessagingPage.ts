import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage, routes } from './BasePage';

export class MessagingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get newMessageButton(): Locator {
    return this.byTestId('new-message-button').or(this.page.getByRole('button', { name: /new message/i })).first();
  }

  get userSearchInput(): Locator {
    return this.byTestId('new-message-user-search').or(this.page.getByPlaceholder(/search.*user|search connections/i)).first();
  }

  get messageInput(): Locator {
    return this.byTestId('message-input')
      .or(this.page.getByRole('textbox', { name: /^message$/i }))
      .or(this.page.getByPlaceholder(/type a message/i))
      .first();
  }

  get sendButton(): Locator {
    return this.byTestId('send-message').or(this.page.getByRole('button', { name: /send message|send/i })).first();
  }

  async gotoMessages(): Promise<void> {
    await this.goto(routes.messages);
    await expect(this.page).toHaveURL(/\/messages|\/login/i);
  }

  async startConversationWith(displayName: string): Promise<void> {
    await this.newMessageButton.click();
    await this.userSearchInput.fill(displayName);
    await this.page.getByRole('option', { name: new RegExp(displayName, 'i') }).first().click();
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async expectMessageDelivered(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
