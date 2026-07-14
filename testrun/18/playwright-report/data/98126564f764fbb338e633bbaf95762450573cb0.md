# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deletePost.spec.ts >> delete post >> User cannot delete another user's post
- Location: e2e/tests/deletePost.spec.ts:31:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="post-card"], article, [data-post-id]').filter({ hasText: 'Foreign post that should not be deletable' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="post-card"], article, [data-post-id]').filter({ hasText: 'Foreign post that should not be deletable' }).first()

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- button "DE":
  - text: DE
  - img
- img "vdpConnect logo"
- heading "Das Netzwerk für Immobilienprofis." [level=1]
- paragraph: Vernetzen Sie sich mit Immobilienprofis, teilen Sie Einblicke und entdecken Sie neue Geschäftsmöglichkeiten.
- heading "Willkommen zurück" [level=2]
- paragraph: Melde dich an und setze deine Gespräche fort.
- button "Microsoft"
- text: Oder mit E-Mail anmelden E-Mail
- img
- textbox "E-Mail":
  - /placeholder: name@firma.de
- text: Passwort
- link "Passwort vergessen?":
  - /url: /forgot-password
- img
- textbox "Passwort":
  - /placeholder: Passwort eingeben
- button "Passwort anzeigen":
  - img
- button "Anmelden"
- paragraph:
  - text: Noch kein Konto?
  - link "Konto erstellen":
    - /url: /signup
- contentinfo:
  - paragraph:
    - text: Mit der Anmeldung stimmen Sie unseren
    - link "Nutzungsbedingungen":
      - /url: /terms
    - text: ", der"
    - link "Datenschutzrichtlinie":
      - /url: /privacy
    - text: ", der"
    - link "Cookie-Richtlinie":
      - /url: /cookie
    - text: und der der
    - link "Erklärung zur Barrierefreiheit":
      - /url: /accessibility
    - text: zu.
- link "Unterstützung":
  - /url: /support?type=support
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
  24 |     await expect(postCard).toBeVisible();
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
> 37 |     await expect(postCard).toBeVisible();
     |                            ^ Error: expect(locator).toBeVisible() failed
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