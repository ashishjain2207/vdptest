# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: createPost.spec.ts >> create post >> User uploads unsupported media file type in post
- Location: e2e/tests/createPost.spec.ts:52:3

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
        - generic [ref=e94]:
          - generic [ref=e95]:
            - generic [ref=e98]:
              - generic [ref=e100]: AS
              - generic [ref=e101]:
                - paragraph [ref=e103]: Ashish
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
            - generic [ref=e114]:
              - article [ref=e162] [cursor=pointer]:
                - generic [ref=e163]:
                  - button "AK" [ref=e164]:
                    - generic [ref=e166]: AK
                  - generic [ref=e167]:
                    - generic [ref=e169]:
                      - button "Anna Keller" [ref=e170]:
                        - generic [ref=e171]: Anna Keller
                      - generic [ref=e172]: ·
                      - generic [ref=e173]: vor 1 Woche
                    - paragraph [ref=e175]: i will kill you
                    - generic [ref=e176]:
                      - button "Kommentare ein- oder ausblenden" [ref=e177]:
                        - img
                        - generic [ref=e178]: "3"
                      - button "Beitrag reposten" [ref=e179]:
                        - img
                        - generic [ref=e180]: "0"
                      - button "Beitrag liken" [ref=e181]:
                        - img
                        - generic [ref=e182]: "0"
                      - button "Beitrag teilen" [ref=e183]:
                        - img
                      - button "Beitrag speichern" [ref=e184]:
                        - img
                    - generic [ref=e186]: 1 Aufrufe
              - article [ref=e188] [cursor=pointer]:
                - generic [ref=e189]:
                  - button "AK" [ref=e190]:
                    - generic [ref=e192]: AK
                  - generic [ref=e193]:
                    - generic [ref=e195]:
                      - button "Anna Keller" [ref=e196]:
                        - generic [ref=e197]: Anna Keller
                      - generic [ref=e198]: ·
                      - generic [ref=e199]: vor 1 Woche
                    - paragraph [ref=e201]: nvznzg
                    - generic [ref=e202]:
                      - button "Kommentare ein- oder ausblenden" [ref=e203]:
                        - img
                        - generic [ref=e204]: "0"
                      - button "Beitrag reposten" [ref=e205]:
                        - img
                        - generic [ref=e206]: "0"
                      - button "Beitrag liken" [ref=e207]:
                        - img
                        - generic [ref=e208]: "0"
                      - button "Beitrag teilen" [ref=e209]:
                        - img
                      - button "Beitrag speichern" [ref=e210]:
                        - img
                    - generic [ref=e212]: 0 Aufrufe
              - article [ref=e214] [cursor=pointer]:
                - generic [ref=e215]:
                  - button "DW" [ref=e216]:
                    - generic [ref=e218]: DW
                  - generic [ref=e219]:
                    - generic [ref=e221]:
                      - button "Dr.Martin weber" [ref=e222]:
                        - generic [ref=e223]: Dr.Martin weber
                      - generic [ref=e224]: ·
                      - generic [ref=e225]: vor 3 Wochen
                    - generic [ref=e226]:
                      - paragraph [ref=e227]:
                        - strong [ref=e228]: "Valuation in the current market environment: Transparency is becoming a quality criterion"
                        - text: Volatile markets increase the need for traceability, data quality and methodological consistency. In addition to location and property quality, market adjustments, alternative use potential, energy-related characteristics and reliable comparable data are gaining importance.
                        - strong [ref=e229]: "Especially in more complex segments, one thing becomes clear:"
                        - text: a strong valuation does not only state the value — it makes the reasoning behind it transparent.
                        - strong [ref=e230]: "Question for the community:"
                        - text: Which valuation parameters have gained the most importance in your practice recently?
                      - img "Post attachment 1" [ref=e234]
                      - generic [ref=e235]:
                        - link "#RealEstateValuation" [ref=e237]:
                          - /url: /explore/tag/RealEstateValuation
                        - link "#ValuationPractice" [ref=e239]:
                          - /url: /explore/tag/ValuationPractice
                        - link "#Appraisers" [ref=e241]:
                          - /url: /explore/tag/Appraisers
                        - link "#MarketData" [ref=e243]:
                          - /url: /explore/tag/MarketData
                        - link "#vdpConnect" [ref=e245]:
                          - /url: /explore/tag/vdpConnect
                    - generic [ref=e246]:
                      - button "Kommentare ein- oder ausblenden" [ref=e247]:
                        - img
                        - generic [ref=e248]: "0"
                      - button "Beitrag reposten" [ref=e249]:
                        - img
                        - generic [ref=e250]: "0"
                      - button "Beitrag liken" [ref=e251]:
                        - img
                        - generic [ref=e252]: "0"
                      - button "Beitrag teilen" [ref=e253]:
                        - img
                      - button "Beitrag speichern" [ref=e254]:
                        - img
                    - generic [ref=e256]: 0 Aufrufe
              - article [ref=e258] [cursor=pointer]:
                - generic [ref=e259]:
                  - button "AK" [ref=e260]:
                    - generic [ref=e262]: AK
                  - generic [ref=e263]:
                    - generic [ref=e265]:
                      - button "Anna Keller" [ref=e266]:
                        - generic [ref=e267]: Anna Keller
                      - generic [ref=e268]: ·
                      - generic [ref=e269]: vor 3 Wochen
                    - generic [ref=e270]:
                      - paragraph [ref=e271]:
                        - strong [ref=e272]: "Residential property markets: Stabilization with regionally different dynamics 🏘️"
                        - text: Our latest market observations indicate signs of stabilization in many metropolitan areas. At the same time, developments in medium-sized cities and rural regions remain heterogeneous — shaped by demand, new construction activity, financing conditions, and local supply structures.
                        - strong [ref=e273]: "Question for the community:"
                        - text: Which regional differences are you currently observing in your day-to-day practice?
                      - img "Post attachment 1" [ref=e277]
                      - generic [ref=e278]:
                        - img [ref=e279]
                        - link "Berlin, Germany" [ref=e282]:
                          - /url: https://www.google.com/maps/search/?api=1&query=Berlin%2C%20Germany
                      - generic [ref=e283]:
                        - link "#ResidentialRealEstate" [ref=e285]:
                          - /url: /explore/tag/ResidentialRealEstate
                        - link "#MarketAnalysis" [ref=e287]:
                          - /url: /explore/tag/MarketAnalysis
                        - link "#RealEstateMarket" [ref=e289]:
                          - /url: /explore/tag/RealEstateMarket
                        - link "#PortfolioAnalysis" [ref=e291]:
                          - /url: /explore/tag/PortfolioAnalysis
                        - link "#vdpConnect" [ref=e293]:
                          - /url: /explore/tag/vdpConnect
                    - generic [ref=e294]:
                      - button "Kommentare ein- oder ausblenden" [ref=e295]:
                        - img
                        - generic [ref=e296]: "0"
                      - button "Beitrag reposten" [ref=e297]:
                        - img
                        - generic [ref=e298]: "0"
                      - button "Beitrag liken" [ref=e299]:
                        - img
                        - generic [ref=e300]: "2"
                      - button "Beitrag teilen" [ref=e301]:
                        - img
                      - button "Aus gespeicherten Beiträgen entfernen" [pressed] [ref=e302]:
                        - img
                    - generic [ref=e304]: 1 Aufrufe
              - article [ref=e306] [cursor=pointer]:
                - generic [ref=e307]:
                  - button "AS" [ref=e308]:
                    - generic [ref=e310]: AS
                  - generic [ref=e311]:
                    - generic [ref=e312]:
                      - generic [ref=e313]:
                        - button "Ashish" [ref=e314]:
                          - generic [ref=e315]: Ashish
                        - generic [ref=e316]: ·
                        - generic [ref=e317]: vor 1 Woche
                      - button "Beitragsaktionen" [ref=e318]:
                        - img
                    - paragraph [ref=e320]: i'll kill you
                    - generic [ref=e321]:
                      - button "Kommentare ein- oder ausblenden" [ref=e322]:
                        - img
                        - generic [ref=e323]: "0"
                      - button "Beitrag reposten" [ref=e324]:
                        - img
                        - generic [ref=e325]: "0"
                      - button "Beitrag liken" [ref=e326]:
                        - img
                        - generic [ref=e327]: "0"
                      - button "Beitrag teilen" [ref=e328]:
                        - img
                      - button "Beitrag speichern" [ref=e329]:
                        - img
                    - generic [ref=e331]: 0 Aufrufe
              - article [ref=e333] [cursor=pointer]:
                - generic [ref=e334]:
                  - button "AS" [ref=e335]:
                    - generic [ref=e337]: AS
                  - generic [ref=e338]:
                    - generic [ref=e339]:
                      - generic [ref=e340]:
                        - button "Ashish" [ref=e341]:
                          - generic [ref=e342]: Ashish
                        - generic [ref=e343]: ·
                        - generic [ref=e344]: vor 1 Woche
                      - button "Beitragsaktionen" [ref=e345]:
                        - img
                    - img "Post attachment 1" [ref=e350]
                    - generic [ref=e351]:
                      - button "Kommentare ein- oder ausblenden" [ref=e352]:
                        - img
                        - generic [ref=e353]: "0"
                      - button "Beitrag reposten" [ref=e354]:
                        - img
                        - generic [ref=e355]: "0"
                      - button "Beitrag liken" [ref=e356]:
                        - img
                        - generic [ref=e357]: "0"
                      - button "Beitrag teilen" [ref=e358]:
                        - img
                      - button "Beitrag speichern" [ref=e359]:
                        - img
                    - generic [ref=e361]: 0 Aufrufe
              - article [ref=e363] [cursor=pointer]:
                - generic [ref=e364]:
                  - button "JS" [ref=e365]:
                    - generic [ref=e367]: JS
                  - generic [ref=e368]:
                    - generic [ref=e369]:
                      - img [ref=e370]
                      - generic [ref=e375]: Sie haben geteilt
                    - generic [ref=e377]:
                      - button "Julia steinbach" [ref=e378]:
                        - generic [ref=e379]: Julia steinbach
                      - generic [ref=e380]: ·
                      - generic [ref=e381]: vor 2 Wochen
                    - paragraph [ref=e383]: test1
                    - generic [ref=e384]:
                      - button "Kommentare ein- oder ausblenden" [ref=e385]:
                        - img
                        - generic [ref=e386]: "0"
                      - button "Repost entfernen" [pressed] [ref=e387]:
                        - img
                        - generic [ref=e388]: "1"
                      - button "Beitrag liken" [ref=e389]:
                        - img
                        - generic [ref=e390]: "0"
                      - button "Beitrag teilen" [ref=e391]:
                        - img
                      - button "Aus gespeicherten Beiträgen entfernen" [pressed] [ref=e392]:
                        - img
                    - generic [ref=e394]: 1 Aufrufe
            - paragraph [ref=e396]: Sie sind auf dem neuesten Stand.
          - generic [ref=e397]:
            - generic [ref=e398]:
              - generic [ref=e400]:
                - img [ref=e401]
                - heading "Trendthemen" [level=2] [ref=e404]
              - paragraph [ref=e406]: Aktuell keine Trends.
              - button "Weitere anzeigen" [ref=e407] [cursor=pointer]:
                - generic [ref=e408]: Weitere anzeigen
                - img [ref=e409]
            - generic [ref=e411]:
              - generic [ref=e413]:
                - img [ref=e414]
                - heading "Personen, die Sie kennen könnten" [level=2] [ref=e419]
              - generic [ref=e421] [cursor=pointer]:
                - generic [ref=e423]: SM
                - generic [ref=e424]:
                  - generic [ref=e426]: Srinath Mamidala
                  - paragraph [ref=e427]: "@srinath_mamidala"
                  - paragraph [ref=e428]: Beliebt auf VdpConnect
                - button "Folgen" [ref=e429]:
                  - generic [ref=e430]: Folgen
              - button "Alle ansehen" [ref=e431] [cursor=pointer]:
                - generic [ref=e432]: Alle ansehen
                - img [ref=e433]
            - generic [ref=e435]:
              - generic [ref=e436]:
                - img [ref=e437]
                - heading "Empfohlene Partner" [level=2] [ref=e441]
              - button "Weitere Partner entdecken" [ref=e464] [cursor=pointer]:
                - generic [ref=e465]: Weitere Partner entdecken
                - img [ref=e466]
            - generic [ref=e468]:
              - generic [ref=e470]:
                - img [ref=e471]
                - heading "Anstehende Veranstaltungen" [level=2] [ref=e473]
              - paragraph [ref=e475]: Noch keine kommenden Veranstaltungen.
              - button "Alle Veranstaltungen" [ref=e476] [cursor=pointer]:
                - generic [ref=e477]: Alle Veranstaltungen
                - img [ref=e478]
        - generic [ref=e480]:
          - generic [ref=e481]:
            - link "Nutzungsbedingungen" [ref=e482] [cursor=pointer]:
              - /url: /terms
            - link "Datenschutzrichtlinie" [ref=e483] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie-Richtlinie" [ref=e484] [cursor=pointer]:
              - /url: /cookie
            - link "Erklärung zur Barrierefreiheit" [ref=e485] [cursor=pointer]:
              - /url: /accessibility
            - link "Unterstützung" [ref=e486] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e487]: © 2026 vdpResearch
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