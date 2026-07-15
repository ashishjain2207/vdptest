import { type Page } from '@playwright/test';

export class PostEditor {
  constructor(readonly page: Page) {}
}
