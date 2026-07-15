import { type Page } from '@playwright/test';

export class ConversationPage {
  constructor(readonly page: Page) {}
}
