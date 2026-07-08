import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MessagingPage extends BasePage {
  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/messages/);
  }

  async enterMessage(message: string): Promise<void> {
    await this.locatorAny(
      this.page.getByTestId('message-input'),
      this.page.getByRole('textbox', { name: /message|write|type/i }),
      this.page.getByPlaceholder(/message|write|type/i),
    ).fill(message);
  }

  async send(): Promise<void> {
    await this.byTestIdOrRole('send-message-button', 'button', /send/i).click();
  }

  async sendMessage(message: string): Promise<void> {
    await this.expectOpen();
    await this.enterMessage(message);
    await this.send();
  }

  async expectMessageDelivered(message: string): Promise<void> {
    await expect(this.page.getByText(message).first()).toBeVisible();
    await this.expectToastOrInlineMessage(/sent|delivered|message/i);
  }
}
