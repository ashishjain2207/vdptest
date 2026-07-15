import { type Page } from '@playwright/test';

export class ShareDialog {
  constructor(readonly page: Page) {}
}
