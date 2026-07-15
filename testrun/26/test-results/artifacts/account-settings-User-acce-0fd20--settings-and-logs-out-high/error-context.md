# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account-settings.spec.ts >> User accesses account and privacy settings and logs out @high
- Location: e2e/tests/account-settings.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main')

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
  - text: ", der"
  - link "Erklärung zur Barrierefreiheit":
    - /url: /accessibility
  - text: und dem
  - link "Impressum":
    - /url: /impressum
  - text: zu.
- paragraph: © 2026 vdpResearch GmbH. Alle Rechte vorbehalten.
- link "Unterstützung":
  - /url: /support?type=support
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | 
  3  | export class AccountSettingsPage {
  4  |   readonly page: Page;
  5  |   readonly mainLandmark: Locator;
  6  |   readonly accountNavLink: Locator;
  7  |   readonly profileNavLink: Locator;
  8  |   readonly logoutButton: Locator;
  9  | 
  10 |   constructor(page: Page) {
  11 |     this.page = page;
  12 |     this.mainLandmark = page.locator('main');
  13 |     this.accountNavLink = page.locator('a[href="/settings/account"]');
  14 |     this.profileNavLink = page.locator('a[href="/settings/profile"]');
  15 |     this.logoutButton = page.locator('div.bg-card.rounded-xl.border.border-border.p-2 > button[type="button"]');
  16 |   }
  17 | 
  18 |   async open(): Promise<void> {
  19 |     await this.page.goto('/settings/account');
  20 |   }
  21 | 
  22 |   async expectVisible(): Promise<void> {
> 23 |     await expect(this.mainLandmark).toBeVisible();
     |                                     ^ Error: expect(locator).toBeVisible() failed
  24 |     await expect(this.accountNavLink).toBeVisible();
  25 |     await expect(this.profileNavLink).toBeVisible();
  26 |   }
  27 | }
  28 | 
```