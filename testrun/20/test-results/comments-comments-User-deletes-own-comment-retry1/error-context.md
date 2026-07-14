# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comments.spec.ts >> comments >> User deletes own comment
- Location: e2e/tests/comments.spec.ts:44:3

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
  - paragraph [ref=e7]: Laden...
  - generic [ref=e8]:
    - complementary [ref=e9]:
      - link "VDPConnect home" [ref=e11] [cursor=pointer]:
        - /url: /posts
        - img "vdpConnect logo" [ref=e12]
      - navigation [ref=e13]:
        - list [ref=e14]:
          - listitem [ref=e15]:
            - link "Startseite" [ref=e16] [cursor=pointer]:
              - /url: /posts
              - img [ref=e17]
              - generic [ref=e20]: Startseite
          - listitem [ref=e21]:
            - link "Entdecken" [ref=e22] [cursor=pointer]:
              - /url: /explore
              - img [ref=e23]
              - generic [ref=e26]: Entdecken
          - listitem [ref=e27]:
            - link "Personen" [ref=e28] [cursor=pointer]:
              - /url: /people
              - img [ref=e29]
              - generic [ref=e34]: Personen
          - listitem [ref=e35]:
            - link "Partner" [ref=e36] [cursor=pointer]:
              - /url: /partners
              - img [ref=e37]
              - generic [ref=e41]: Partner
          - listitem [ref=e42]:
            - link "Veranstaltungen" [ref=e43] [cursor=pointer]:
              - /url: /events
              - img [ref=e44]
              - generic [ref=e46]: Veranstaltungen
          - listitem [ref=e47]:
            - link "Unterhaltungen" [ref=e48] [cursor=pointer]:
              - /url: /messages
              - img [ref=e49]
              - generic [ref=e51]: Unterhaltungen
          - listitem [ref=e52]:
            - link "Benachrichtigungen" [ref=e53] [cursor=pointer]:
              - /url: /notifications
              - img [ref=e54]
              - generic [ref=e57]: Benachrichtigungen
              - generic [ref=e58]: "4"
          - listitem [ref=e59]:
            - link "Gespeicherte Beiträge" [ref=e60] [cursor=pointer]:
              - /url: /bookmarks
              - img [ref=e61]
              - generic [ref=e63]: Gespeicherte Beiträge
          - listitem [ref=e64]:
            - link "Einstellungen" [ref=e65] [cursor=pointer]:
              - /url: /settings
              - img [ref=e66]
              - generic [ref=e69]: Einstellungen
    - generic [ref=e76]:
      - banner [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e80]:
            - img
            - textbox "Nach Beiträgen und Personen suchen …" [ref=e81]
          - generic [ref=e82]:
            - button "Beitrag erstellen" [ref=e83] [cursor=pointer]:
              - img
              - generic [ref=e84]: Beitrag erstellen
            - button "DE" [ref=e86] [cursor=pointer]:
              - text: DE
              - img
            - button "Notifications" [ref=e87] [cursor=pointer]:
              - img
              - generic [ref=e88]: "4"
            - link "Rückmeldung senden" [ref=e90] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e91]: Rückmeldung
            - button "..." [disabled]:
              - generic:
                - generic: ...
      - main [ref=e93]:
        - generic [ref=e96]:
          - generic [ref=e100]:
            - generic [ref=e102]: US
            - generic [ref=e103]:
              - textbox "Beitragsinhalt" [ref=e105]:
                - /placeholder: Was möchten Sie teilen?
              - generic [ref=e106]:
                - generic [ref=e107]:
                  - button "Bild hinzufügen" [ref=e108] [cursor=pointer]:
                    - img
                  - button "Link hinzufügen" [ref=e109] [cursor=pointer]:
                    - img
                  - button "Umfrage erstellen" [ref=e110] [cursor=pointer]:
                    - img
                  - button "Standort hinzufügen" [ref=e111] [cursor=pointer]:
                    - img
                  - button "Emoji hinzufügen" [ref=e112] [cursor=pointer]:
                    - img
                - generic [ref=e113]:
                  - button "Veröffentlichen" [disabled]:
                    - img
                    - text: Veröffentlichen
          - generic [ref=e161]:
            - generic [ref=e162]:
              - generic [ref=e164]:
                - img [ref=e165]
                - heading "Trendthemen" [level=2] [ref=e168]
              - paragraph [ref=e170]: Aktuell keine Trends.
              - button "Weitere anzeigen" [ref=e171] [cursor=pointer]:
                - generic [ref=e172]: Weitere anzeigen
                - img [ref=e173]
            - generic [ref=e175]:
              - generic [ref=e177]:
                - img [ref=e178]
                - heading "Personen, die Sie kennen könnten" [level=2] [ref=e183]
              - button "Alle ansehen" [ref=e204] [cursor=pointer]:
                - generic [ref=e205]: Alle ansehen
                - img [ref=e206]
            - generic [ref=e208]:
              - generic [ref=e209]:
                - img [ref=e210]
                - heading "Empfohlene Partner" [level=2] [ref=e214]
              - button "Weitere Partner entdecken" [ref=e237] [cursor=pointer]:
                - generic [ref=e238]: Weitere Partner entdecken
                - img [ref=e239]
            - generic [ref=e241]:
              - generic [ref=e243]:
                - img [ref=e244]
                - heading "Anstehende Veranstaltungen" [level=2] [ref=e246]
              - paragraph [ref=e248]: Laden…
              - button "Alle Veranstaltungen" [ref=e249] [cursor=pointer]:
                - generic [ref=e250]: Alle Veranstaltungen
                - img [ref=e251]
        - generic [ref=e253]:
          - generic [ref=e254]:
            - link "Nutzungsbedingungen" [ref=e255] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e256] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e257] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e258] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e259] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e260]: © 2026 vdpResearch
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