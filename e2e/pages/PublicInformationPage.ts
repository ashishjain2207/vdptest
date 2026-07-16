import { expect, type Locator, type Page } from '@playwright/test';

export class PublicInformationPage {
  readonly page: Page;
  readonly mainLandmark: Locator;
  readonly heading: Locator;
  readonly homeLink: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainLandmark = page.locator('main');
    this.heading = page.locator('main h1');
    this.homeLink = page.locator('a[aria-label="VDPConnect home"]');
    this.backLink = page.locator('header a').nth(1);
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path);
    await expect(this.mainLandmark).toBeVisible();
    await expect(this.heading).toBeVisible();
    await expect(this.homeLink).toBeVisible();
  }

  async expectBackLinkTarget(href: string): Promise<void> {
    await expect(this.backLink).toHaveAttribute('href', href);
  }
}
