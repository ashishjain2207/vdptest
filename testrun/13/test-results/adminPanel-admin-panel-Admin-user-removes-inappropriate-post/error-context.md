# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: adminPanel.spec.ts >> admin panel >> Admin user removes inappropriate post
- Location: e2e/tests/adminPanel.spec.ts:17:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="reported-post-row"], [data-testid="reported-post-item"], tr, article').filter({ hasText: 'Reported post content for moderation' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="reported-post-row"], [data-testid="reported-post-item"], tr, article').filter({ hasText: 'Reported post content for moderation' }).first()

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
          - text: Benachrichtigungen
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
  - link "Rückmeldung senden":
    - /url: /support?type=feedback
    - text: Rückmeldung
  - button "Ashish":
    - img "Ashish"
- main:
  - heading "Zugriff verweigert" [level=1]
  - paragraph: Sie haben keine Berechtigung für den Unterstützungs-Posteingang oder Admin-Bereiche. Diese Seiten sind nur für Plattform-Unterstützung und Administratoren.
  - link "Startseite":
    - /url: /posts
  - link "Unterstützung kontaktieren":
    - /url: /support?type=support
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
  1  | import { expect, type Page } from '@playwright/test';
  2  | import { clickFirst, fillFirst } from '../utils/locators';
  3  | 
  4  | export class AdminPanelPage {
  5  |   constructor(private readonly page: Page) {}
  6  | 
  7  |   async goto(): Promise<void> {
  8  |     await this.page.goto('/admin');
  9  |   }
  10 | 
  11 |   async openReportedPosts(): Promise<void> {
  12 |     const target = this.page.getByRole('link', { name: /reported posts|content moderation|reports/i }).first();
  13 |     if (await target.count()) {
  14 |       await target.click();
  15 |     } else {
  16 |       await this.page.goto('/admin/content-moderation');
  17 |     }
  18 |   }
  19 | 
  20 |   async removeReportedPost(postText: string): Promise<void> {
  21 |     const row = this.page
  22 |       .locator('[data-testid="reported-post-row"], [data-testid="reported-post-item"], tr, article')
  23 |       .filter({ hasText: postText })
  24 |       .first();
> 25 |     await expect(row).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  26 |     await row.locator('[data-testid="remove-post"], button:has-text("Remove"), button:has-text("Delete")').first().click();
  27 |     const confirm = this.page.locator('[data-testid="confirm-remove"], [data-testid="confirm-delete"], button:has-text("Confirm")').first();
  28 |     if (await confirm.count()) {
  29 |       await confirm.click();
  30 |     }
  31 |   }
  32 | 
  33 |   async expectPostRemoved(postText: string): Promise<void> {
  34 |     await expect(this.page.getByText(postText)).toHaveCount(0);
  35 |   }
  36 | 
  37 |   async openUserManagement(): Promise<void> {
  38 |     const link = this.page.getByRole('link', { name: /users|user management/i }).first();
  39 |     if (await link.count()) {
  40 |       await link.click();
  41 |     } else {
  42 |       await this.page.goto('/admin/users');
  43 |     }
  44 |   }
  45 | 
  46 |   async searchUser(identifier: string): Promise<void> {
  47 |     const searchInput = this.page.locator('[data-testid="admin-user-search"], input[placeholder*="Search"], input[type="search"]').first();
  48 |     if (await searchInput.count()) {
  49 |       await fillFirst(this.page, ['[data-testid="admin-user-search"]', 'input[placeholder*="Search"]', 'input[type="search"]'], identifier);
  50 |     }
  51 |   }
  52 | 
  53 |   async suspendUser(): Promise<void> {
  54 |     await clickFirst(this.page, ['[data-testid="suspend-user-button"]', 'button:has-text("Suspend")']);
  55 |     const confirm = this.page.locator('[data-testid="confirm-suspend"], button:has-text("Confirm")').first();
  56 |     if (await confirm.count()) {
  57 |       await confirm.click();
  58 |     }
  59 |   }
  60 | 
  61 |   async reactivateUser(): Promise<void> {
  62 |     await clickFirst(this.page, ['[data-testid="reactivate-user-button"]', 'button:has-text("Reactivate")']);
  63 |     const confirm = this.page.locator('[data-testid="confirm-reactivate"], button:has-text("Confirm")').first();
  64 |     if (await confirm.count()) {
  65 |       await confirm.click();
  66 |     }
  67 |   }
  68 | 
  69 |   async expectUserStatus(status: 'suspended' | 'active'): Promise<void> {
  70 |     await expect(this.page.getByText(new RegExp(status, 'i')).first()).toBeVisible();
  71 |   }
  72 | }
  73 | 
```