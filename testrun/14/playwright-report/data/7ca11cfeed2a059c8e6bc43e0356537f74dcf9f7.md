# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editProfile.spec.ts >> edit profile >> Profile edit fails with invalid website URL
- Location: e2e/tests/editProfile.spec.ts:36:3

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
            - button "DE" [ref=e80] [cursor=pointer]:
              - text: DE
              - img
            - button "Notifications" [ref=e81] [cursor=pointer]:
              - img
            - link "Rückmeldung senden" [ref=e83] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e84]: Rückmeldung
            - button "AS" [ref=e85] [cursor=pointer]:
              - generic [ref=e87]: AS
      - main [ref=e89]:
        - generic [ref=e91]:
          - heading "Einstellungen" [level=1] [ref=e92]
          - generic [ref=e93]:
            - generic [ref=e95]:
              - link "Profil" [ref=e96] [cursor=pointer]:
                - /url: /settings/profile
                - img [ref=e97]
                - generic [ref=e100]: Profil
              - link "Konto" [ref=e101] [cursor=pointer]:
                - /url: /settings/account
                - img [ref=e102]
                - generic [ref=e105]: Konto
              - button "Abmelden" [ref=e106] [cursor=pointer]:
                - img [ref=e107]
                - generic [ref=e110]: Abmelden
            - generic [ref=e112]:
              - generic [ref=e113]:
                - heading "Profil bearbeiten" [level=2] [ref=e114]
                - paragraph [ref=e115]: Verwalten Sie die Informationen, die in Ihrem Profil angezeigt werden.
              - generic [ref=e116]:
                - generic [ref=e117]:
                  - generic [ref=e118]: Titelbild
                  - button "Titelbild ändern" [ref=e121] [cursor=pointer]:
                    - img
                    - generic [ref=e122]: Titelbild ändern
                - generic [ref=e123]:
                  - generic [ref=e124]:
                    - generic [ref=e126]: U
                    - button [ref=e127] [cursor=pointer]:
                      - img [ref=e128]
                  - generic [ref=e131]:
                    - paragraph [ref=e132]: Profilbild
                    - button "Profilbild hochladen" [ref=e134] [cursor=pointer]:
                      - generic [ref=e135]: Profilbild hochladen
                - generic [ref=e137]:
                  - generic [ref=e138]: Land
                  - combobox "Heimatland" [disabled] [ref=e140]
                - generic [ref=e141]:
                  - generic [ref=e142]:
                    - generic [ref=e143]: Anzeigename
                    - textbox "Anzeigename" [ref=e144]:
                      - /placeholder: Ihr Anzeigename
                  - generic [ref=e145]:
                    - generic [ref=e146]: Benutzername
                    - generic [ref=e147]:
                      - generic [ref=e148]: "@"
                      - textbox "Benutzername" [ref=e149]:
                        - /placeholder: benutzername
                  - generic [ref=e150]:
                    - generic [ref=e151]: Kurzbiografie
                    - textbox "Kurzbiografie" [ref=e152]:
                      - /placeholder: Stellen Sie sich vor...
                  - generic [ref=e153]:
                    - generic [ref=e154]:
                      - generic [ref=e156]: Unternehmen/Organisation
                      - textbox "Unternehmen/Organisation" [ref=e158]:
                        - /placeholder: Unternehmen oder Organisation eingeben
                    - generic [ref=e159]:
                      - generic [ref=e161]: Titel/Position
                      - img [ref=e163]
                  - generic [ref=e165]:
                    - generic [ref=e166]: Standort
                    - generic [ref=e167]:
                      - button "Aktuellen Standort verwenden" [ref=e168] [cursor=pointer]:
                        - img
                        - generic [ref=e169]: Aktuellen Standort verwenden
                      - textbox "Search for a location" [ref=e171]:
                        - /placeholder: Stadt, Adresse oder Standort suchen …
                  - generic [ref=e172]:
                    - generic [ref=e173]: Kontakt-E-Mail-Adresse
                    - textbox "Kontakt-E-Mail-Adresse" [ref=e174]:
                      - /placeholder: you@example.com
                  - generic [ref=e175]:
                    - generic [ref=e176]: LinkedIn-Profil
                    - textbox "LinkedIn-Profil" [ref=e177]:
                      - /placeholder: https://linkedin.com/in/yourprofile
                  - generic [ref=e178]:
                    - generic [ref=e179]: Über mich
                    - textbox "Über mich" [ref=e180]:
                      - /placeholder: Beschreiben Sie Ihre Erfahrung, Schwerpunkte und Interessen.
                  - generic [ref=e181]:
                    - generic [ref=e182]: Website
                    - textbox "Website" [ref=e183]:
                      - /placeholder: https://yourwebsite.com
                - generic [ref=e184]:
                  - button "Abbrechen" [ref=e185] [cursor=pointer]:
                    - generic [ref=e186]: Abbrechen
                  - button "Änderungen speichern" [ref=e187] [cursor=pointer]
        - generic [ref=e188]:
          - generic [ref=e189]:
            - link "Nutzungsbedingungen" [ref=e190] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e191] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e192] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e193] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e194] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e195]: © 2026 vdpResearch
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