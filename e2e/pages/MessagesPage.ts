import { type Page } from '@playwright/test';

export class MessagesPage {
  constructor(readonly page: Page) {}
}
