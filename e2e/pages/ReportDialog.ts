import { type Page } from '@playwright/test';

export class ReportDialog {
  constructor(readonly page: Page) {}
}
