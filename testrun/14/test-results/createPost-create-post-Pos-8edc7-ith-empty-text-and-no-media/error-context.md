# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: createPost.spec.ts >> create post >> Post creation fails with empty text and no media
- Location: e2e/tests/createPost.spec.ts:40:3

# Error details

```
Error: No locator matched any selector: [data-testid="create-post-trigger"], [data-testid="post-create-button"]
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
          - generic [ref=e99]:
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
            - generic [ref=e118]:
              - article [ref=e120] [cursor=pointer]:
                - generic [ref=e121]:
                  - button "AK" [ref=e122]:
                    - generic [ref=e124]: AK
                  - generic [ref=e125]:
                    - generic [ref=e127]:
                      - button "Anna Keller" [ref=e128]:
                        - generic [ref=e129]: Anna Keller
                      - generic [ref=e130]: ·
                      - generic [ref=e131]: vor 1 Woche
                    - paragraph [ref=e133]: i will kill you
                    - generic [ref=e134]:
                      - button "Kommentare ein- oder ausblenden" [ref=e135]:
                        - img
                        - generic [ref=e136]: "3"
                      - button "Beitrag reposten" [ref=e137]:
                        - img
                        - generic [ref=e138]: "0"
                      - button "Beitrag liken" [ref=e139]:
                        - img
                        - generic [ref=e140]: "0"
                      - button "Beitrag teilen" [ref=e141]:
                        - img
                      - button "Beitrag speichern" [ref=e142]:
                        - img
                    - generic [ref=e144]: 1 Aufrufe
              - article [ref=e146] [cursor=pointer]:
                - generic [ref=e147]:
                  - button "AK" [ref=e148]:
                    - generic [ref=e150]: AK
                  - generic [ref=e151]:
                    - generic [ref=e153]:
                      - button "Anna Keller" [ref=e154]:
                        - generic [ref=e155]: Anna Keller
                      - generic [ref=e156]: ·
                      - generic [ref=e157]: vor 1 Woche
                    - paragraph [ref=e159]: nvznzg
                    - generic [ref=e160]:
                      - button "Kommentare ein- oder ausblenden" [ref=e161]:
                        - img
                        - generic [ref=e162]: "0"
                      - button "Beitrag reposten" [ref=e163]:
                        - img
                        - generic [ref=e164]: "0"
                      - button "Beitrag liken" [ref=e165]:
                        - img
                        - generic [ref=e166]: "0"
                      - button "Beitrag teilen" [ref=e167]:
                        - img
                      - button "Beitrag speichern" [ref=e168]:
                        - img
                    - generic [ref=e170]: 0 Aufrufe
              - article [ref=e172] [cursor=pointer]:
                - generic [ref=e173]:
                  - button "DW" [ref=e174]:
                    - generic [ref=e176]: DW
                  - generic [ref=e177]:
                    - generic [ref=e179]:
                      - button "Dr.Martin weber" [ref=e180]:
                        - generic [ref=e181]: Dr.Martin weber
                      - generic [ref=e182]: ·
                      - generic [ref=e183]: vor 3 Wochen
                    - generic [ref=e184]:
                      - paragraph [ref=e185]:
                        - strong [ref=e186]: "Valuation in the current market environment: Transparency is becoming a quality criterion"
                        - text: Volatile markets increase the need for traceability, data quality and methodological consistency. In addition to location and property quality, market adjustments, alternative use potential, energy-related characteristics and reliable comparable data are gaining importance.
                        - strong [ref=e187]: "Especially in more complex segments, one thing becomes clear:"
                        - text: a strong valuation does not only state the value — it makes the reasoning behind it transparent.
                        - strong [ref=e188]: "Question for the community:"
                        - text: Which valuation parameters have gained the most importance in your practice recently?
                      - img "Post attachment 1" [ref=e192]
                      - generic [ref=e193]:
                        - link "#RealEstateValuation" [ref=e195]:
                          - /url: /explore/tag/RealEstateValuation
                        - link "#ValuationPractice" [ref=e197]:
                          - /url: /explore/tag/ValuationPractice
                        - link "#Appraisers" [ref=e199]:
                          - /url: /explore/tag/Appraisers
                        - link "#MarketData" [ref=e201]:
                          - /url: /explore/tag/MarketData
                        - link "#vdpConnect" [ref=e203]:
                          - /url: /explore/tag/vdpConnect
                    - generic [ref=e204]:
                      - button "Kommentare ein- oder ausblenden" [ref=e205]:
                        - img
                        - generic [ref=e206]: "0"
                      - button "Beitrag reposten" [ref=e207]:
                        - img
                        - generic [ref=e208]: "0"
                      - button "Beitrag liken" [ref=e209]:
                        - img
                        - generic [ref=e210]: "0"
                      - button "Beitrag teilen" [ref=e211]:
                        - img
                      - button "Beitrag speichern" [ref=e212]:
                        - img
                    - generic [ref=e214]: 0 Aufrufe
              - article [ref=e216] [cursor=pointer]:
                - generic [ref=e217]:
                  - button "AK" [ref=e218]:
                    - generic [ref=e220]: AK
                  - generic [ref=e221]:
                    - generic [ref=e223]:
                      - button "Anna Keller" [ref=e224]:
                        - generic [ref=e225]: Anna Keller
                      - generic [ref=e226]: ·
                      - generic [ref=e227]: vor 3 Wochen
                    - generic [ref=e228]:
                      - paragraph [ref=e229]:
                        - strong [ref=e230]: "Residential property markets: Stabilization with regionally different dynamics 🏘️"
                        - text: Our latest market observations indicate signs of stabilization in many metropolitan areas. At the same time, developments in medium-sized cities and rural regions remain heterogeneous — shaped by demand, new construction activity, financing conditions, and local supply structures.
                        - strong [ref=e231]: "Question for the community:"
                        - text: Which regional differences are you currently observing in your day-to-day practice?
                      - img "Post attachment 1" [ref=e235]
                      - generic [ref=e236]:
                        - img [ref=e237]
                        - link "Berlin, Germany" [ref=e240]:
                          - /url: https://www.google.com/maps/search/?api=1&query=Berlin%2C%20Germany
                      - generic [ref=e241]:
                        - link "#ResidentialRealEstate" [ref=e243]:
                          - /url: /explore/tag/ResidentialRealEstate
                        - link "#MarketAnalysis" [ref=e245]:
                          - /url: /explore/tag/MarketAnalysis
                        - link "#RealEstateMarket" [ref=e247]:
                          - /url: /explore/tag/RealEstateMarket
                        - link "#PortfolioAnalysis" [ref=e249]:
                          - /url: /explore/tag/PortfolioAnalysis
                        - link "#vdpConnect" [ref=e251]:
                          - /url: /explore/tag/vdpConnect
                    - generic [ref=e252]:
                      - button "Kommentare ein- oder ausblenden" [ref=e253]:
                        - img
                        - generic [ref=e254]: "0"
                      - button "Beitrag reposten" [ref=e255]:
                        - img
                        - generic [ref=e256]: "0"
                      - button "Beitrag liken" [ref=e257]:
                        - img
                        - generic [ref=e258]: "2"
                      - button "Beitrag teilen" [ref=e259]:
                        - img
                      - button "Aus gespeicherten Beiträgen entfernen" [pressed] [ref=e260]:
                        - img
                    - generic [ref=e262]: 1 Aufrufe
              - article [ref=e264] [cursor=pointer]:
                - generic [ref=e265]:
                  - button "Ashish" [ref=e266]:
                    - img "Ashish" [ref=e268]
                  - generic [ref=e269]:
                    - generic [ref=e270]:
                      - generic [ref=e271]:
                        - button "Ashish" [ref=e272]:
                          - generic [ref=e273]: Ashish
                        - generic [ref=e274]: ·
                        - generic [ref=e275]: vor 1 Woche
                      - button "Beitragsaktionen" [ref=e276]:
                        - img
                    - paragraph [ref=e278]: i'll kill you
                    - generic [ref=e279]:
                      - button "Kommentare ein- oder ausblenden" [ref=e280]:
                        - img
                        - generic [ref=e281]: "0"
                      - button "Beitrag reposten" [ref=e282]:
                        - img
                        - generic [ref=e283]: "0"
                      - button "Beitrag liken" [ref=e284]:
                        - img
                        - generic [ref=e285]: "0"
                      - button "Beitrag teilen" [ref=e286]:
                        - img
                      - button "Beitrag speichern" [ref=e287]:
                        - img
                    - generic [ref=e289]: 0 Aufrufe
              - article [ref=e291] [cursor=pointer]:
                - generic [ref=e292]:
                  - button "Ashish" [ref=e293]:
                    - img "Ashish" [ref=e295]
                  - generic [ref=e296]:
                    - generic [ref=e297]:
                      - generic [ref=e298]:
                        - button "Ashish" [ref=e299]:
                          - generic [ref=e300]: Ashish
                        - generic [ref=e301]: ·
                        - generic [ref=e302]: vor 1 Woche
                      - button "Beitragsaktionen" [ref=e303]:
                        - img
                    - img "Post attachment 1" [ref=e308]
                    - generic [ref=e309]:
                      - button "Kommentare ein- oder ausblenden" [ref=e310]:
                        - img
                        - generic [ref=e311]: "0"
                      - button "Beitrag reposten" [ref=e312]:
                        - img
                        - generic [ref=e313]: "0"
                      - button "Beitrag liken" [ref=e314]:
                        - img
                        - generic [ref=e315]: "0"
                      - button "Beitrag teilen" [ref=e316]:
                        - img
                      - button "Beitrag speichern" [ref=e317]:
                        - img
                    - generic [ref=e319]: 0 Aufrufe
              - article [ref=e321] [cursor=pointer]:
                - generic [ref=e322]:
                  - button "JS" [ref=e323]:
                    - generic [ref=e325]: JS
                  - generic [ref=e326]:
                    - generic [ref=e327]:
                      - img [ref=e328]
                      - generic [ref=e333]: Sie haben geteilt
                    - generic [ref=e335]:
                      - button "Julia steinbach" [ref=e336]:
                        - generic [ref=e337]: Julia steinbach
                      - generic [ref=e338]: ·
                      - generic [ref=e339]: vor 2 Wochen
                    - paragraph [ref=e341]: test1
                    - generic [ref=e342]:
                      - button "Kommentare ein- oder ausblenden" [ref=e343]:
                        - img
                        - generic [ref=e344]: "0"
                      - button "Repost entfernen" [pressed] [ref=e345]:
                        - img
                        - generic [ref=e346]: "1"
                      - button "Beitrag liken" [ref=e347]:
                        - img
                        - generic [ref=e348]: "0"
                      - button "Beitrag teilen" [ref=e349]:
                        - img
                      - button "Aus gespeicherten Beiträgen entfernen" [pressed] [ref=e350]:
                        - img
                    - generic [ref=e352]: 1 Aufrufe
            - paragraph [ref=e354]: Sie sind auf dem neuesten Stand.
          - generic [ref=e355]:
            - generic [ref=e356]:
              - generic [ref=e358]:
                - img [ref=e359]
                - heading "Trendthemen" [level=2] [ref=e362]
              - paragraph [ref=e364]: Aktuell keine Trends.
              - button "Weitere anzeigen" [ref=e365] [cursor=pointer]:
                - generic [ref=e366]: Weitere anzeigen
                - img [ref=e367]
            - generic [ref=e369]:
              - generic [ref=e371]:
                - img [ref=e372]
                - heading "Personen, die Sie kennen könnten" [level=2] [ref=e377]
              - generic [ref=e379] [cursor=pointer]:
                - generic [ref=e381]: SM
                - generic [ref=e382]:
                  - generic [ref=e384]: Srinath Mamidala
                  - paragraph [ref=e385]: "@srinath_mamidala"
                  - paragraph [ref=e386]: Beliebt auf VdpConnect
                - button "Folgen" [ref=e387]:
                  - generic [ref=e388]: Folgen
              - button "Alle ansehen" [ref=e389] [cursor=pointer]:
                - generic [ref=e390]: Alle ansehen
                - img [ref=e391]
            - generic [ref=e393]:
              - generic [ref=e394]:
                - img [ref=e395]
                - heading "Empfohlene Partner" [level=2] [ref=e399]
              - paragraph [ref=e401]: Noch keine Partner.
              - button "Weitere Partner entdecken" [ref=e402] [cursor=pointer]:
                - generic [ref=e403]: Weitere Partner entdecken
                - img [ref=e404]
            - generic [ref=e406]:
              - generic [ref=e408]:
                - img [ref=e409]
                - heading "Anstehende Veranstaltungen" [level=2] [ref=e411]
              - paragraph [ref=e413]: Noch keine kommenden Veranstaltungen.
              - button "Alle Veranstaltungen" [ref=e414] [cursor=pointer]:
                - generic [ref=e415]: Alle Veranstaltungen
                - img [ref=e416]
        - generic [ref=e418]:
          - generic [ref=e419]:
            - link "Nutzungsbedingungen" [ref=e420] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e421] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e422] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e423] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e424] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e425]: © 2026 vdpResearch
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
     |         ^ Error: No locator matched any selector: [data-testid="create-post-trigger"], [data-testid="post-create-button"]
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