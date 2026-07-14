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
        - generic [ref=e97]:
          - heading "Einstellungen" [level=1] [ref=e98]
          - generic [ref=e99]:
            - generic [ref=e101]:
              - link "Profil" [ref=e102] [cursor=pointer]:
                - /url: /settings/profile
                - img [ref=e103]
                - generic [ref=e106]: Profil
              - link "Konto" [ref=e107] [cursor=pointer]:
                - /url: /settings/account
                - img [ref=e108]
                - generic [ref=e111]: Konto
              - button "Abmelden" [ref=e112] [cursor=pointer]:
                - img [ref=e113]
                - generic [ref=e116]: Abmelden
            - generic [ref=e118]:
              - generic [ref=e119]:
                - heading "Profil bearbeiten" [level=2] [ref=e120]
                - paragraph [ref=e121]: Verwalten Sie die Informationen, die in Ihrem Profil angezeigt werden.
              - generic [ref=e122]:
                - generic [ref=e123]:
                  - generic [ref=e124]: Titelbild
                  - generic [ref=e125]:
                    - img "Cover" [ref=e127]
                    - generic [ref=e128]:
                      - button "Ändern" [ref=e129] [cursor=pointer]:
                        - img
                        - generic [ref=e130]: Ändern
                      - button "Entfernen" [ref=e131] [cursor=pointer]:
                        - generic [ref=e132]: Entfernen
                - generic [ref=e133]:
                  - generic [ref=e134]:
                    - img "Ashish" [ref=e136]
                    - button [ref=e137] [cursor=pointer]:
                      - img [ref=e138]
                  - generic [ref=e141]:
                    - paragraph [ref=e142]: Profilbild
                    - generic [ref=e143]:
                      - button "Ändern" [ref=e144] [cursor=pointer]:
                        - generic [ref=e145]: Ändern
                      - button "Entfernen" [ref=e146] [cursor=pointer]:
                        - generic [ref=e147]: Entfernen
                - generic [ref=e149]:
                  - generic [ref=e150]: Land
                  - combobox "Heimatland" [disabled] [ref=e153]: Canada
                - generic [ref=e154]:
                  - generic [ref=e155]:
                    - generic [ref=e156]: Anzeigename
                    - textbox "Anzeigename" [ref=e157]:
                      - /placeholder: Ihr Anzeigename
                      - text: Ashish
                  - generic [ref=e158]:
                    - generic [ref=e159]: Benutzername
                    - generic [ref=e160]:
                      - generic [ref=e161]: "@"
                      - textbox "Benutzername" [ref=e162]:
                        - /placeholder: benutzername
                        - text: ashishjain
                  - generic [ref=e163]:
                    - generic [ref=e164]: Kurzbiografie
                    - textbox "Kurzbiografie" [ref=e165]:
                      - /placeholder: Stellen Sie sich vor...
                  - generic [ref=e166]:
                    - generic [ref=e167]:
                      - generic [ref=e169]: Unternehmen/Organisation
                      - textbox "Unternehmen/Organisation" [ref=e171]:
                        - /placeholder: Unternehmen oder Organisation eingeben
                    - generic [ref=e172]:
                      - generic [ref=e174]: Titel/Position
                      - generic [ref=e175]:
                        - textbox "Titel/Position" [ref=e176]:
                          - /placeholder: Titel oder Position eingeben/auswählen …
                        - img
                  - generic [ref=e177]:
                    - generic [ref=e178]: Standort
                    - generic [ref=e179]:
                      - button "Aktuellen Standort verwenden" [ref=e180] [cursor=pointer]:
                        - img
                        - generic [ref=e181]: Aktuellen Standort verwenden
                      - textbox "Search for a location" [ref=e183]:
                        - /placeholder: Stadt, Adresse oder Standort suchen …
                  - generic [ref=e184]:
                    - generic [ref=e185]: Kontakt-E-Mail-Adresse
                    - textbox "Kontakt-E-Mail-Adresse" [ref=e186]:
                      - /placeholder: you@example.com
                      - text: ashish.jain@imriva.de
                  - generic [ref=e187]:
                    - generic [ref=e188]: LinkedIn-Profil
                    - textbox "LinkedIn-Profil" [ref=e189]:
                      - /placeholder: https://linkedin.com/in/yourprofile
                  - generic [ref=e190]:
                    - generic [ref=e191]: Über mich
                    - textbox "Über mich" [ref=e192]:
                      - /placeholder: Beschreiben Sie Ihre Erfahrung, Schwerpunkte und Interessen.
                  - generic [ref=e193]:
                    - generic [ref=e194]: Website
                    - textbox "Website" [ref=e195]:
                      - /placeholder: https://yourwebsite.com
                - generic [ref=e196]:
                  - button "Abbrechen" [ref=e197] [cursor=pointer]:
                    - generic [ref=e198]: Abbrechen
                  - button "Änderungen speichern" [ref=e199] [cursor=pointer]
        - generic [ref=e200]:
          - generic [ref=e201]:
            - link "Nutzungsbedingungen" [ref=e202] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e203] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e204] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e205] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e206] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e207]: © 2026 vdpResearch
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