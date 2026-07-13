# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comments.spec.ts >> comments >> Comment submission fails with empty text
- Location: e2e/tests/comments.spec.ts:34:3

# Error details

```
Error: No locator matched any selector: [data-testid="comment-input"], textarea[name="comment"], textarea[placeholder*="comment"]
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
          - listitem [ref=e53]:
            - link "Gespeicherte Beiträge" [ref=e54] [cursor=pointer]:
              - /url: /bookmarks
              - img [ref=e55]
              - generic [ref=e57]: Gespeicherte Beiträge
          - listitem [ref=e58]:
            - link "Einstellungen" [ref=e59] [cursor=pointer]:
              - /url: /settings
              - img [ref=e60]
              - generic [ref=e63]: Einstellungen
    - generic [ref=e70]:
      - banner [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e74]:
            - img
            - textbox "Nach Beiträgen und Personen suchen …" [ref=e75]
          - generic [ref=e76]:
            - button "Beitrag erstellen" [ref=e77] [cursor=pointer]:
              - img
              - generic [ref=e78]: Beitrag erstellen
            - button "DE" [ref=e79] [cursor=pointer]:
              - text: DE
              - img
            - button "Notifications" [ref=e80] [cursor=pointer]:
              - img
            - link "Rückmeldung senden" [ref=e81] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e82]: Rückmeldung
            - button "Ashish" [ref=e83] [cursor=pointer]:
              - img "Ashish" [ref=e85]
      - main [ref=e87]:
        - generic [ref=e90]:
          - generic [ref=e94]:
            - img "Ashish" [ref=e96]
            - generic [ref=e97]:
              - paragraph [ref=e99]: Ashish
              - textbox "Beitragsinhalt" [ref=e101]:
                - /placeholder: Was möchten Sie teilen?
              - generic [ref=e102]:
                - generic [ref=e103]:
                  - button "Bild hinzufügen" [ref=e104] [cursor=pointer]:
                    - img
                  - button "Link hinzufügen" [ref=e105] [cursor=pointer]:
                    - img
                  - button "Umfrage erstellen" [ref=e106] [cursor=pointer]:
                    - img
                  - button "Standort hinzufügen" [ref=e107] [cursor=pointer]:
                    - img
                  - button "Emoji hinzufügen" [ref=e108] [cursor=pointer]:
                    - img
                - generic [ref=e109]:
                  - button "Veröffentlichen" [disabled]:
                    - img
                    - text: Veröffentlichen
          - generic [ref=e157]:
            - generic [ref=e158]:
              - generic [ref=e160]:
                - img [ref=e161]
                - heading "Trendthemen" [level=2] [ref=e164]
              - paragraph [ref=e166]: Aktuell keine Trends.
              - button "Weitere anzeigen" [ref=e167] [cursor=pointer]:
                - generic [ref=e168]: Weitere anzeigen
                - img [ref=e169]
            - generic [ref=e171]:
              - generic [ref=e173]:
                - img [ref=e174]
                - heading "Personen, die Sie kennen könnten" [level=2] [ref=e179]
              - button "Alle ansehen" [ref=e200] [cursor=pointer]:
                - generic [ref=e201]: Alle ansehen
                - img [ref=e202]
            - generic [ref=e204]:
              - generic [ref=e205]:
                - img [ref=e206]
                - heading "Empfohlene Partner" [level=2] [ref=e210]
              - button "Weitere Partner entdecken" [ref=e233] [cursor=pointer]:
                - generic [ref=e234]: Weitere Partner entdecken
                - img [ref=e235]
            - generic [ref=e237]:
              - generic [ref=e239]:
                - img [ref=e240]
                - heading "Anstehende Veranstaltungen" [level=2] [ref=e242]
              - paragraph [ref=e244]: Noch keine kommenden Veranstaltungen.
              - button "Alle Veranstaltungen" [ref=e245] [cursor=pointer]:
                - generic [ref=e246]: Alle Veranstaltungen
                - img [ref=e247]
        - generic [ref=e249]:
          - generic [ref=e250]:
            - link "Nutzungsbedingungen" [ref=e251] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e252] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e253] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e254] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e255] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e256]: © 2026 vdpResearch
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
     |         ^ Error: No locator matched any selector: [data-testid="comment-input"], textarea[name="comment"], textarea[placeholder*="comment"]
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