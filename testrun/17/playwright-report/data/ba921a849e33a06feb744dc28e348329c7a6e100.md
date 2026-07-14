# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editPost.spec.ts >> edit post >> User cannot edit another user's post
- Location: e2e/tests/editPost.spec.ts:33:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="post-card"], article, [data-post-id]').filter({ hasText: 'This post belongs to another user' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="post-card"], article, [data-post-id]').filter({ hasText: 'This post belongs to another user' }).first()

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- complementary:
  - link "VDPConnect home":
    - /url: /posts
    - img "vdpConnect logo"
  - navigation:
    - list:
      - listitem:
        - link "Startseite":
          - /url: /posts
          - img
          - text: Startseite
      - listitem:
        - link "Entdecken":
          - /url: /explore
          - img
          - text: Entdecken
      - listitem:
        - link "Personen":
          - /url: /people
          - img
          - text: Personen
      - listitem:
        - link "Partner":
          - /url: /partners
          - img
          - text: Partner
      - listitem:
        - link "Veranstaltungen":
          - /url: /events
          - img
          - text: Veranstaltungen
      - listitem:
        - link "Unterhaltungen":
          - /url: /messages
          - img
          - text: Unterhaltungen
      - listitem:
        - link "Benachrichtigungen":
          - /url: /notifications
          - img
          - text: Benachrichtigungen 4
      - listitem:
        - link "Gespeicherte Beiträge":
          - /url: /bookmarks
          - img
          - text: Gespeicherte Beiträge
      - listitem:
        - link "Einstellungen":
          - /url: /settings
          - img
          - text: Einstellungen
  - img "Ashish"
  - paragraph: Ashish
  - paragraph: "@ashishjain"
  - img
- banner:
  - textbox "Nach Beiträgen und Personen suchen …"
  - button "Beitrag erstellen":
    - img
    - text: Beitrag erstellen
  - button "DE":
    - text: DE
    - img
  - button "Notifications":
    - img
    - text: "4"
  - link "Rückmeldung senden":
    - /url: /support?type=feedback
    - text: Rückmeldung
  - button "Ashish":
    - img "Ashish"
- main:
  - button "Zurück":
    - img
    - text: Zurück
  - paragraph: Profil nicht gefunden
  - link "Nutzungsbedingungen":
    - /url: /terms
  - link "Datenschutzrichtlinie":
    - /url: /privacy
  - link "Cookie-Richtlinie":
    - /url: /cookie
  - link "Erklärung zur Barrierefreiheit":
    - /url: /accessibility
  - link "Unterstützung":
    - /url: /support?type=support
  - paragraph: © 2026 vdpResearch
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | import { clickFirst } from '../utils/locators';
  3  | 
  4  | export class UserProfilePage {
  5  |   constructor(private readonly page: Page) {}
  6  | 
  7  |   async gotoUserProfile(userId: string): Promise<void> {
  8  |     await this.page.goto(`/profile/${encodeURIComponent(userId)}`);
  9  |   }
  10 | 
  11 |   async gotoOwnProfile(ownUserId = 'me'): Promise<void> {
  12 |     await this.gotoUserProfile(ownUserId);
  13 |   }
  14 | 
  15 |   private postCardByText(contentSnippet: string): Locator {
  16 |     return this.page
  17 |       .locator('[data-testid="post-card"], article, [data-post-id]')
  18 |       .filter({ hasText: contentSnippet })
  19 |       .first();
  20 |   }
  21 | 
  22 |   async expectNoEditOptionForPost(contentSnippet: string): Promise<void> {
  23 |     const postCard = this.postCardByText(contentSnippet);
> 24 |     await expect(postCard).toBeVisible();
     |                            ^ Error: expect(locator).toBeVisible() failed
  25 | 
  26 |     const menuTrigger = postCard.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
  27 |     if (await menuTrigger.count()) {
  28 |       await menuTrigger.click();
  29 |     }
  30 | 
  31 |     await expect(this.page.getByRole('menuitem', { name: /edit/i })).toHaveCount(0);
  32 |     await expect(this.page.getByRole('button', { name: /edit/i })).toHaveCount(0);
  33 |   }
  34 | 
  35 |   async expectNoDeleteOptionForPost(contentSnippet: string): Promise<void> {
  36 |     const postCard = this.postCardByText(contentSnippet);
  37 |     await expect(postCard).toBeVisible();
  38 | 
  39 |     const menuTrigger = postCard.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
  40 |     if (await menuTrigger.count()) {
  41 |       await menuTrigger.click();
  42 |     }
  43 | 
  44 |     await expect(this.page.getByRole('menuitem', { name: /delete/i })).toHaveCount(0);
  45 |     await expect(this.page.getByRole('button', { name: /delete/i })).toHaveCount(0);
  46 |   }
  47 | 
  48 |   async followUser(): Promise<void> {
  49 |     await clickFirst(this.page, ['[data-testid="follow-button"]', 'button:has-text("Follow")']);
  50 |   }
  51 | 
  52 |   async unfollowUser(): Promise<void> {
  53 |     await clickFirst(this.page, ['[data-testid="unfollow-button"]', 'button:has-text("Unfollow")']);
  54 |   }
  55 | 
  56 |   async expectFollowState(isFollowing: boolean): Promise<void> {
  57 |     if (isFollowing) {
  58 |       await expect(this.page.getByRole('button', { name: /unfollow/i }).first()).toBeVisible();
  59 |     } else {
  60 |       await expect(this.page.getByRole('button', { name: /follow/i }).first()).toBeVisible();
  61 |     }
  62 |   }
  63 | 
  64 |   async expectCannotFollowSelf(): Promise<void> {
  65 |     await expect(this.page.locator('[data-testid="follow-button"], button:has-text("Follow")')).toHaveCount(0);
  66 |   }
  67 | }
  68 | 
```