# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edit-profile.spec.ts >> User updates profile information and cancels an unsaved edit @medium
- Location: e2e/tests/edit-profile.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#name')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('#name')

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
  3  | export class EditProfilePage {
  4  |   readonly page: Page;
  5  |   readonly nameInput: Locator;
  6  |   readonly handleInput: Locator;
  7  |   readonly bioInput: Locator;
  8  |   readonly locationInput: Locator;
  9  |   readonly cancelButton: Locator;
  10 |   readonly saveButton: Locator;
  11 | 
  12 |   constructor(page: Page) {
  13 |     this.page = page;
  14 |     this.nameInput = page.locator('#name');
  15 |     this.handleInput = page.locator('#handle');
  16 |     this.bioInput = page.locator('#bio');
  17 |     this.locationInput = page.locator('#location');
  18 |     this.cancelButton = page.locator('button').nth(0);
  19 |     this.saveButton = page.locator('button').nth(1);
  20 |   }
  21 | 
  22 |   async open(): Promise<void> {
  23 |     await this.page.goto('/settings/profile');
> 24 |     await expect(this.nameInput).toBeVisible();
     |                                  ^ Error: expect(locator).toBeVisible() failed
  25 |   }
  26 | }
  27 | 
```