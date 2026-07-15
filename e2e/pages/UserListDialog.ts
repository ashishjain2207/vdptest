import { type Page } from '@playwright/test';

export class UserListDialog {
  constructor(readonly page: Page) {}
}
