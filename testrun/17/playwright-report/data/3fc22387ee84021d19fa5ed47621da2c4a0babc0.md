# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.ts >> registration >> Successful user registration with valid inputs
- Location: e2e/tests/registration.spec.ts:29:3

# Error details

```
Error: No locator matched any selector: [data-testid="registration-full-name"], [data-testid="signup-full-name"], input[name="fullName"], #fullName
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - button "DE" [ref=e5] [cursor=pointer]:
      - text: DE
      - img
    - generic [ref=e11]:
      - img "vdpConnect logo" [ref=e13]
      - heading "Das Netzwerk für Immobilienprofis." [level=1] [ref=e14]
      - paragraph [ref=e15]: Vernetzen Sie sich mit Immobilienprofis, teilen Sie Einblicke und entdecken Sie neue Geschäftsmöglichkeiten.
      - generic [ref=e16]:
        - generic [ref=e17]:
          - paragraph [ref=e18]: 50K+
          - paragraph [ref=e19]: Fachleute
        - generic [ref=e20]:
          - paragraph [ref=e21]: 2K+
          - paragraph [ref=e22]: Organisationen
        - generic [ref=e23]:
          - paragraph [ref=e24]: 100+
          - paragraph [ref=e25]: Tägliche Events
    - generic [ref=e27]:
      - heading "Erstellen Sie Ihr Konto und werden Sie Teil des Netzwerks." [level=2] [ref=e29]
      - generic [ref=e30]:
        - button "Microsoft" [ref=e32] [cursor=pointer]:
          - img
          - text: Microsoft
        - generic [ref=e34]: Oder mit E-Mail registrieren
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]: Name *
          - generic [ref=e38]:
            - img [ref=e39]
            - textbox "Name" [ref=e42]:
              - /placeholder: z. B. Max Mustermann
        - generic [ref=e43]:
          - generic [ref=e44]: Benutzername *
          - generic [ref=e45]:
            - img [ref=e46]
            - textbox "Benutzername" [ref=e49]:
              - /placeholder: z. B. maxmustermann
        - generic [ref=e50]:
          - generic [ref=e51]:
            - text: Land *
            - generic [ref=e52]: (Erforderlich bei E-Mail-Registrierung)
          - combobox "Land (Erforderlich bei E-Mail-Registrierung)" [ref=e54]
        - generic [ref=e55]:
          - generic [ref=e56]: Geschäftliche E-Mail-Adresse *
          - generic [ref=e57]:
            - img [ref=e58]
            - textbox "Geschäftliche E-Mail-Adresse" [ref=e61]:
              - /placeholder: sie@firma.de
        - generic [ref=e62]:
          - generic [ref=e63]: Passwort *
          - generic [ref=e64]:
            - img [ref=e65]
            - textbox "Passwort" [ref=e68]:
              - /placeholder: Passwort erstellen
            - button "Passwort anzeigen" [ref=e69] [cursor=pointer]:
              - img [ref=e70]
        - button "Kostenloses Konto erstellen" [ref=e73] [cursor=pointer]:
          - generic [ref=e74]: Kostenloses Konto erstellen
        - paragraph [ref=e75]:
          - text: Mit der Registrierung stimmen Sie unseren
          - link "Nutzungsbedingungen" [ref=e76] [cursor=pointer]:
            - /url: /terms
          - text: ", der"
          - link "Datenschutzrichtlinie" [ref=e77] [cursor=pointer]:
            - /url: /privacy
          - text: ", der"
          - link "Cookie-Richtlinie" [ref=e78] [cursor=pointer]:
            - /url: /cookie
          - text: und der der
          - link "Erklärung zur Barrierefreiheit" [ref=e79] [cursor=pointer]:
            - /url: /accessibility
          - text: zu.
      - paragraph [ref=e80]:
        - text: Bereits registriert?
        - link "Anmelden" [ref=e81] [cursor=pointer]:
          - /url: /login
    - link "Unterstützung" [ref=e82] [cursor=pointer]:
      - /url: /support?type=support
      - img [ref=e83]
      - generic [ref=e86]: Unterstützung
```

# Test source

```ts
  1  | import { type Locator, type Page } from '@playwright/test';
  2  | 
  3  | async function exists(locator: Locator): Promise<boolean> {
  4  |   return (await locator.count()) > 0;
  5  | }
  6  | 
  7  | export async function firstExistingLocator(page: Page, selectors: string[]): Promise<Locator> {
  8  |   for (const selector of selectors) {
  9  |     const locator = page.locator(selector).first();
  10 |     if (await exists(locator)) {
  11 |       return locator;
  12 |     }
  13 |   }
  14 | 
> 15 |   throw new Error(`No locator matched any selector: ${selectors.join(', ')}`);
     |         ^ Error: No locator matched any selector: [data-testid="registration-full-name"], [data-testid="signup-full-name"], input[name="fullName"], #fullName
  16 | }
  17 | 
  18 | export async function fillFirst(page: Page, selectors: string[], value: string): Promise<void> {
  19 |   const locator = await firstExistingLocator(page, selectors);
  20 |   await locator.fill(value);
  21 | }
  22 | 
  23 | export async function clickFirst(page: Page, selectors: string[]): Promise<void> {
  24 |   const locator = await firstExistingLocator(page, selectors);
  25 |   await locator.click();
  26 | }
  27 | 
  28 | export async function checkFirst(page: Page, selectors: string[]): Promise<void> {
  29 |   const locator = await firstExistingLocator(page, selectors);
  30 |   await locator.check();
  31 | }
  32 | 
  33 | export async function isAnyVisible(page: Page, selectors: string[]): Promise<boolean> {
  34 |   for (const selector of selectors) {
  35 |     const locator = page.locator(selector).first();
  36 |     if ((await locator.count()) > 0 && (await locator.isVisible())) {
  37 |       return true;
  38 |     }
  39 |   }
  40 |   return false;
  41 | }
  42 | 
```