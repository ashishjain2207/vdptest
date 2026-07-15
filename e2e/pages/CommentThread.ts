import { type Page } from '@playwright/test';

export class CommentThread {
  constructor(readonly page: Page) {}
}
