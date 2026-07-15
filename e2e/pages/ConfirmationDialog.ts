import { type Page } from '@playwright/test';

export class ConfirmationDialog {
  constructor(readonly page: Page) {}
}
