# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editProfile.spec.ts >> edit profile >> User edits profile with valid inputs
- Location: e2e/tests/editProfile.spec.ts:19:3

# Error details

```
Error: No locator matched any selector: [data-testid="profile-display-name"], input[name="displayName"], input[name="name"]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - link "VDPConnect home" [ref=e6] [cursor=pointer]:
        - /url: /posts
        - img "vdpConnect logo" [ref=e7]
      - navigation [ref=e8]:
        - list [ref=e9]:
          - listitem [ref=e10]:
            - link "Startseite" [ref=e11] [cursor=pointer]:
              - /url: /posts
              - img [ref=e12]
              - generic [ref=e15]: Startseite
          - listitem [ref=e16]:
            - link "Entdecken" [ref=e17] [cursor=pointer]:
              - /url: /explore
              - img [ref=e18]
              - generic [ref=e21]: Entdecken
          - listitem [ref=e22]:
            - link "Personen" [ref=e23] [cursor=pointer]:
              - /url: /people
              - img [ref=e24]
              - generic [ref=e29]: Personen
          - listitem [ref=e30]:
            - link "Partner" [ref=e31] [cursor=pointer]:
              - /url: /partners
              - img [ref=e32]
              - generic [ref=e36]: Partner
          - listitem [ref=e37]:
            - link "Veranstaltungen" [ref=e38] [cursor=pointer]:
              - /url: /events
              - img [ref=e39]
              - generic [ref=e41]: Veranstaltungen
          - listitem [ref=e42]:
            - link "Unterhaltungen" [ref=e43] [cursor=pointer]:
              - /url: /messages
              - img [ref=e44]
              - generic [ref=e46]: Unterhaltungen
          - listitem [ref=e47]:
            - link "Benachrichtigungen" [ref=e48] [cursor=pointer]:
              - /url: /notifications
              - img [ref=e49]
              - generic [ref=e52]: Benachrichtigungen
              - generic [ref=e53]: "4"
          - listitem [ref=e54]:
            - link "Gespeicherte Beiträge" [ref=e55] [cursor=pointer]:
              - /url: /bookmarks
              - img [ref=e56]
              - generic [ref=e58]: Gespeicherte Beiträge
          - listitem [ref=e59]:
            - link "Einstellungen" [ref=e60] [cursor=pointer]:
              - /url: /settings
              - img [ref=e61]
              - generic [ref=e64]: Einstellungen
    - generic [ref=e71]:
      - banner [ref=e72]:
        - generic [ref=e73]:
          - generic [ref=e75]:
            - img
            - textbox "Nach Beiträgen und Personen suchen …" [ref=e76]
          - generic [ref=e77]:
            - button "Beitrag erstellen" [ref=e78] [cursor=pointer]:
              - img
              - generic [ref=e79]: Beitrag erstellen
            - button "DE" [ref=e81] [cursor=pointer]:
              - text: DE
              - img
            - button "Notifications" [ref=e82] [cursor=pointer]:
              - img
              - generic [ref=e83]: "4"
            - link "Rückmeldung senden" [ref=e85] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e86]: Rückmeldung
            - button "AS" [ref=e87] [cursor=pointer]:
              - generic [ref=e89]: AS
      - main [ref=e91]:
        - generic [ref=e93]:
          - heading "Einstellungen" [level=1] [ref=e94]
          - generic [ref=e95]:
            - generic [ref=e97]:
              - link "Profil" [ref=e98] [cursor=pointer]:
                - /url: /settings/profile
                - img [ref=e99]
                - generic [ref=e102]: Profil
              - link "Konto" [ref=e103] [cursor=pointer]:
                - /url: /settings/account
                - img [ref=e104]
                - generic [ref=e107]: Konto
              - button "Abmelden" [ref=e108] [cursor=pointer]:
                - img [ref=e109]
                - generic [ref=e112]: Abmelden
            - generic [ref=e115]:
              - heading "Profil bearbeiten" [level=2] [ref=e116]
              - paragraph [ref=e117]: Verwalten Sie die Informationen, die in Ihrem Profil angezeigt werden.
        - generic [ref=e131]:
          - generic [ref=e132]:
            - link "Nutzungsbedingungen" [ref=e133] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e134] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e135] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e136] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e137] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e138]: © 2026 vdpResearch
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
     |         ^ Error: No locator matched any selector: [data-testid="profile-display-name"], input[name="displayName"], input[name="name"]
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