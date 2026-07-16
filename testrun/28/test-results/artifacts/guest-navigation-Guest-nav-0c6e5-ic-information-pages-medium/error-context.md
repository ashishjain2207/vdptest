# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guest-navigation.spec.ts >> Guest navigates the landing page and public information pages @medium
- Location: e2e/tests/guest-navigation.spec.ts:7:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a[aria-label="VDPConnect home"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('a[aria-label="VDPConnect home"]')

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- banner:
  - link "vdpConnect home":
    - /url: /signup
    - img "vdpConnect"
  - link "Back to sign up":
    - /url: /signup
  - button "EN":
    - text: EN
    - img
- main:
  - heading "Terms of Use" [level=1]
  - paragraph: Welcome to vdpConnect. By using our service, you agree to these terms. Please read them carefully.
  - region "Acceptance of Terms":
    - heading "Acceptance of Terms" [level=2]
    - paragraph: By accessing or using vdpConnect, you agree to be bound by these Terms of Use and all applicable laws and regulations.
  - region "Use of Service":
    - heading "Use of Service" [level=2]
    - paragraph: You agree to use the service only for lawful purposes and in accordance with these terms. You must not use the service in any way that could harm, disable, or impair the platform.
  - region "User Content":
    - heading "User Content" [level=2]
    - paragraph: You retain ownership of content you post. By posting, you grant us a license to display and distribute your content within the service.
- contentinfo:
  - navigation "Legal":
    - link "Terms of Use":
      - /url: /terms
    - link "Privacy Policy":
      - /url: /privacy
    - link "Cookie Policy":
      - /url: /cookie
    - link "Accessibility Statement":
      - /url: /accessibility
    - link "Legal Notice":
      - /url: /impressum
    - link "Support":
      - /url: /support?type=support
  - paragraph: © 2026 vdpResearch GmbH. All rights reserved.
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | 
  3  | export class PublicInformationPage {
  4  |   readonly page: Page;
  5  |   readonly mainLandmark: Locator;
  6  |   readonly heading: Locator;
  7  |   readonly homeLink: Locator;
  8  |   readonly backLink: Locator;
  9  | 
  10 |   constructor(page: Page) {
  11 |     this.page = page;
  12 |     this.mainLandmark = page.locator('main');
  13 |     this.heading = page.locator('main h1');
  14 |     this.homeLink = page.locator('a[aria-label="VDPConnect home"]');
  15 |     this.backLink = page.locator('header a').nth(1);
  16 |   }
  17 | 
  18 |   async open(path: string): Promise<void> {
  19 |     await this.page.goto(path);
  20 |     await expect(this.mainLandmark).toBeVisible();
  21 |     await expect(this.heading).toBeVisible();
> 22 |     await expect(this.homeLink).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
  23 |   }
  24 | 
  25 |   async expectBackLinkTarget(href: string): Promise<void> {
  26 |     await expect(this.backLink).toHaveAttribute('href', href);
  27 |   }
  28 | }
  29 | 
```