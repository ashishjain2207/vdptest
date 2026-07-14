# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> onboarding >> Onboarding flow completes successfully with optional steps skipped
- Location: e2e/tests/onboarding.spec.ts:12:3

# Error details

```
Error: No locator matched any selector: [data-testid="onboarding-complete"], [data-testid="onboarding-finish"]
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
      - generic [ref=e66] [cursor=pointer]:
        - img "Ashish" [ref=e68]
        - generic [ref=e69]:
          - paragraph [ref=e70]: Ashish
          - paragraph [ref=e71]: "@ashishjain"
        - img [ref=e72]
    - generic [ref=e75]:
      - banner [ref=e76]:
        - generic [ref=e77]:
          - generic [ref=e79]:
            - img
            - textbox "Nach Beiträgen und Personen suchen …" [ref=e80]
          - generic [ref=e81]:
            - button "Beitrag erstellen" [ref=e82] [cursor=pointer]:
              - img
              - generic [ref=e83]: Beitrag erstellen
            - button "DE" [ref=e85] [cursor=pointer]:
              - text: DE
              - img
            - button "Notifications" [ref=e86] [cursor=pointer]:
              - img
              - generic [ref=e87]: "4"
            - link "Rückmeldung senden" [ref=e89] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e90]: Rückmeldung
            - button "Ashish" [ref=e91] [cursor=pointer]:
              - img "Ashish" [ref=e93]
      - main [ref=e95]:
        - generic [ref=e98]:
          - generic [ref=e102]:
            - img "Ashish" [ref=e104]
            - generic [ref=e105]:
              - paragraph [ref=e107]: Ashish
              - textbox "Beitragsinhalt" [ref=e109]:
                - /placeholder: Was möchten Sie teilen?
              - generic [ref=e110]:
                - generic [ref=e111]:
                  - button "Bild hinzufügen" [ref=e112] [cursor=pointer]:
                    - img
                  - button "Link hinzufügen" [ref=e113] [cursor=pointer]:
                    - img
                  - button "Umfrage erstellen" [ref=e114] [cursor=pointer]:
                    - img
                  - button "Standort hinzufügen" [ref=e115] [cursor=pointer]:
                    - img
                  - button "Emoji hinzufügen" [ref=e116] [cursor=pointer]:
                    - img
                - generic [ref=e117]:
                  - button "Veröffentlichen" [disabled]:
                    - img
                    - text: Veröffentlichen
          - generic [ref=e165]:
            - generic [ref=e166]:
              - generic [ref=e168]:
                - img [ref=e169]
                - heading "Trendthemen" [level=2] [ref=e172]
              - paragraph [ref=e174]: Aktuell keine Trends.
              - button "Weitere anzeigen" [ref=e175] [cursor=pointer]:
                - generic [ref=e176]: Weitere anzeigen
                - img [ref=e177]
            - generic [ref=e179]:
              - generic [ref=e181]:
                - img [ref=e182]
                - heading "Personen, die Sie kennen könnten" [level=2] [ref=e187]
              - generic [ref=e189] [cursor=pointer]:
                - generic [ref=e191]: SM
                - generic [ref=e192]:
                  - generic [ref=e194]: Srinath Mamidala
                  - paragraph [ref=e195]: "@srinath_mamidala"
                  - paragraph [ref=e196]: Beliebt auf VdpConnect
                - button "Folgen" [ref=e197]:
                  - generic [ref=e198]: Folgen
              - button "Alle ansehen" [ref=e199] [cursor=pointer]:
                - generic [ref=e200]: Alle ansehen
                - img [ref=e201]
            - generic [ref=e203]:
              - generic [ref=e204]:
                - img [ref=e205]
                - heading "Empfohlene Partner" [level=2] [ref=e209]
              - paragraph [ref=e211]: Noch keine Partner.
              - button "Weitere Partner entdecken" [ref=e212] [cursor=pointer]:
                - generic [ref=e213]: Weitere Partner entdecken
                - img [ref=e214]
            - generic [ref=e216]:
              - generic [ref=e218]:
                - img [ref=e219]
                - heading "Anstehende Veranstaltungen" [level=2] [ref=e221]
              - paragraph [ref=e223]: Noch keine kommenden Veranstaltungen.
              - button "Alle Veranstaltungen" [ref=e224] [cursor=pointer]:
                - generic [ref=e225]: Alle Veranstaltungen
                - img [ref=e226]
        - generic [ref=e228]:
          - generic [ref=e229]:
            - link "Nutzungsbedingungen" [ref=e230] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e231] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e232] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e233] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e234] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e235]: © 2026 vdpResearch
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
     |         ^ Error: No locator matched any selector: [data-testid="onboarding-complete"], [data-testid="onboarding-finish"]
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