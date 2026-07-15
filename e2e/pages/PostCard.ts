import { expect, type Locator, type Page } from '@playwright/test';

export class PostCard {
  readonly root: Locator;
  readonly actionButtons: Locator;

  constructor(page: Page, root?: Locator) {
    this.root = root ?? page.locator('article').first();
    this.actionButtons = this.root.locator('button[aria-label]');
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  commentButton(): Locator {
    return this.actionButtons.nth(0);
  }

  repostButton(): Locator {
    return this.actionButtons.nth(1);
  }

  likeButton(): Locator {
    return this.actionButtons.nth(2);
  }

  shareButton(): Locator {
    return this.actionButtons.nth(3);
  }

  bookmarkButton(): Locator {
    return this.actionButtons.nth(4);
  }
}
