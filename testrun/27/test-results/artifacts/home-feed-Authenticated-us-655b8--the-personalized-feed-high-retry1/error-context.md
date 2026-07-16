# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-feed.spec.ts >> Authenticated user views and incrementally loads the personalized feed @high
- Location: e2e/tests/home-feed.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByLabel(/create post/i)
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByLabel(/create post/i)
    23 × locator resolved to <button aria-label="Create post" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-secondary h-10 w-10 sm:hidden shadow-soft">…</button>
       - unexpected value "hidden"

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- complementary:
  - link "VDPConnect home":
    - /url: /posts
    - img "vdpConnect logo"
  - navigation:
    - list:
      - listitem:
        - link "Home":
          - /url: /posts
          - img
          - text: Home
      - listitem:
        - link "Explore":
          - /url: /explore
          - img
          - text: Explore
      - listitem:
        - link "People":
          - /url: /people
          - img
          - text: People
      - listitem:
        - link "Partners":
          - /url: /partners
          - img
          - text: Partners
      - listitem:
        - link "Events":
          - /url: /events
          - img
          - text: Events
      - listitem:
        - link "Conversations":
          - /url: /messages
          - img
          - text: Conversations
      - listitem:
        - link "Notifications":
          - /url: /notifications
          - img
          - text: Notifications
      - listitem:
        - link "Saved posts":
          - /url: /bookmarks
          - img
          - text: Saved posts
      - listitem:
        - link "Settings":
          - /url: /settings
          - img
          - text: Settings
  - img "Ashish"
  - paragraph: Ashish
  - paragraph: "@ashishjain"
  - img
- banner:
  - textbox "Search posts and people …"
  - button "Create post":
    - img
    - text: Create post
  - button "EN":
    - text: EN
    - img
  - button "Notifications":
    - img
  - link "Send feedback":
    - /url: /support?type=feedback
    - text: Feedback
  - button "Ashish":
    - img "Ashish"
- main:
  - img "Ashish"
  - paragraph: Ashish
  - textbox "Post content":
    - /placeholder: What would you like to share?
  - button "Add image":
    - img
  - button "Add link":
    - img
  - button "Create poll":
    - img
  - button "Add location":
    - img
  - button "Add emoji":
    - img
  - button "Publish" [disabled]:
    - img
    - text: Publish
  - article:
    - button "AK"
    - button "Anna Keller"
    - text: · 2 weeks ago
    - paragraph: i will kill you
    - button "Toggle comments":
      - img
      - text: "3"
    - button "Repost post":
      - img
      - text: "0"
    - button "Like post":
      - img
      - text: "0"
    - button "Share post":
      - img
    - button "Save post":
      - img
    - text: 1 views
  - article:
    - button "AK"
    - button "Anna Keller"
    - text: · 2 weeks ago
    - paragraph: nvznzg
    - button "Toggle comments":
      - img
      - text: "0"
    - button "Repost post":
      - img
      - text: "0"
    - button "Like post":
      - img
      - text: "0"
    - button "Share post":
      - img
    - button "Save post":
      - img
    - text: 0 views
  - article:
    - button "DW"
    - button "Dr.Martin weber"
    - text: · 3 weeks ago
    - paragraph:
      - strong: "Valuation in the current market environment: Transparency is becoming a quality criterion"
      - text: Volatile markets increase the need for traceability, data quality and methodological consistency. In addition to location and property quality, market adjustments, alternative use potential, energy-related characteristics and reliable comparable data are gaining importance.
      - strong: "Especially in more complex segments, one thing becomes clear:"
      - text: a strong valuation does not only state the value — it makes the reasoning behind it transparent.
      - strong: "Question for the community:"
      - text: Which valuation parameters have gained the most importance in your practice recently?
    - img "Post attachment 1"
    - link "#RealEstateValuation":
      - /url: /explore/tag/RealEstateValuation
    - link "#ValuationPractice":
      - /url: /explore/tag/ValuationPractice
    - link "#Appraisers":
      - /url: /explore/tag/Appraisers
    - link "#MarketData":
      - /url: /explore/tag/MarketData
    - link "#vdpConnect":
      - /url: /explore/tag/vdpConnect
    - button "Toggle comments":
      - img
      - text: "0"
    - button "Repost post":
      - img
      - text: "0"
    - button "Like post":
      - img
      - text: "0"
    - button "Share post":
      - img
    - button "Save post":
      - img
    - text: 0 views
  - article:
    - button "AK"
    - button "Anna Keller"
    - text: · 3 weeks ago
    - paragraph:
      - strong: "Residential property markets: Stabilization with regionally different dynamics 🏘️"
      - text: Our latest market observations indicate signs of stabilization in many metropolitan areas. At the same time, developments in medium-sized cities and rural regions remain heterogeneous — shaped by demand, new construction activity, financing conditions, and local supply structures.
      - strong: "Question for the community:"
      - text: Which regional differences are you currently observing in your day-to-day practice?
    - img "Post attachment 1"
    - img
    - link "Berlin, Germany":
      - /url: https://www.google.com/maps/search/?api=1&query=Berlin%2C%20Germany
    - link "#ResidentialRealEstate":
      - /url: /explore/tag/ResidentialRealEstate
    - link "#MarketAnalysis":
      - /url: /explore/tag/MarketAnalysis
    - link "#RealEstateMarket":
      - /url: /explore/tag/RealEstateMarket
    - link "#PortfolioAnalysis":
      - /url: /explore/tag/PortfolioAnalysis
    - link "#vdpConnect":
      - /url: /explore/tag/vdpConnect
    - button "Toggle comments":
      - img
      - text: "0"
    - button "Repost post":
      - img
      - text: "0"
    - button "Like post":
      - img
      - text: "2"
    - button "Share post":
      - img
    - button "Remove from saved posts" [pressed]:
      - img
    - text: 1 views
  - article:
    - button "Ashish":
      - img "Ashish"
    - button "Ashish"
    - text: · 2 weeks ago
    - button "Post actions":
      - img
    - paragraph: i'll kill you
    - button "Toggle comments":
      - img
      - text: "0"
    - button "Repost post":
      - img
      - text: "0"
    - button "Like post":
      - img
      - text: "0"
    - button "Share post":
      - img
    - button "Save post":
      - img
    - text: 0 views
  - article:
    - button "Ashish":
      - img "Ashish"
    - button "Ashish"
    - text: · 2 weeks ago
    - button "Post actions":
      - img
    - img "Post attachment 1"
    - button "Toggle comments":
      - img
      - text: "0"
    - button "Repost post":
      - img
      - text: "0"
    - button "Like post":
      - img
      - text: "0"
    - button "Share post":
      - img
    - button "Save post":
      - img
    - text: 0 views
  - article:
    - button "JS"
    - text: You reposted
    - button "Julia steinbach"
    - text: · 3 weeks ago
    - paragraph: test1
    - button "Toggle comments":
      - img
      - text: "0"
    - button "Undo repost" [pressed]:
      - img
      - text: "1"
    - button "Like post":
      - img
      - text: "0"
    - button "Share post":
      - img
    - button "Remove from saved posts" [pressed]:
      - img
    - text: 1 views
  - paragraph: You're all caught up.
  - img
  - heading "Trending topics" [level=2]
  - paragraph: No trending topics right now.
  - button "View more":
    - text: View more
    - img
  - img
  - heading "People you may know" [level=2]
  - text: SM Srinath Mamidala
  - paragraph: "@srinath_mamidala"
  - paragraph: Popular on VdpConnect
  - button "Follow"
  - button "View all":
    - text: View all
    - img
  - img
  - heading "Recommended partners" [level=2]
  - paragraph: No partners to show yet.
  - button "Discover more partners":
    - text: Discover more partners
    - img
  - img
  - heading "Upcoming Events" [level=2]
  - paragraph: No upcoming events yet.
  - button "View all events":
    - text: View all events
    - img
  - navigation "Legal":
    - link "Terms of Use":
      - /url: /terms
    - link "Privacy Policy":
      - /url: /privacy
    - link "Cookie Policy":
      - /url: /cookie
    - link "Accessibility Statement":
      - /url: /accessibility
    - link "Legal Notice":
      - /url: /impressum
    - link "Support":
      - /url: /support?type=support
  - paragraph: © 2026 vdpResearch GmbH. All rights reserved.
```

# Test source

```ts
  1  | import { LoginPage } from '../pages/LoginPage';
  2  | import { HomeFeedPage } from '../pages/HomeFeedPage';
  3  | import { expect, loginWithDefaultUser, test } from '../fixtures/test';
  4  | 
  5  | test('Authenticated user views and incrementally loads the personalized feed @high', async ({ page }) => {
  6  |   const loginPage = new LoginPage(page);
  7  |   const homeFeedPage = new HomeFeedPage(page);
  8  |   await loginWithDefaultUser(page, loginPage);
  9  |   await homeFeedPage.open();
  10 |   await homeFeedPage.expectShellVisible();
  11 |   await expect(page.getByTestId('header-global-search')).toBeVisible();
> 12 |   await expect(page.getByLabel(/create post/i)).toBeVisible();
     |                                                 ^ Error: expect(locator).toBeVisible() failed
  13 | 
  14 |   const feedArticles = page.locator('main article');
  15 |   const emptyFeedState = page.getByText(/no posts yet\. create your first post above\./i);
  16 |   await expect
  17 |     .poll(async () => (await feedArticles.count()) > 0 || (await emptyFeedState.count()) > 0)
  18 |     .toBeTruthy();
  19 | });
  20 | 
  21 | test('Guest is denied access to the home feed @high', async ({ page }) => {
  22 |   const homeFeedPage = new HomeFeedPage(page);
  23 |   await homeFeedPage.open();
  24 | 
  25 |   await expect(page).toHaveURL(/\/login(?:\?|$)/);
  26 |   await expect(page.locator('#email')).toBeVisible();
  27 |   await expect(page.locator('#password')).toBeVisible();
  28 |   await expect(page.locator('main article')).toHaveCount(0);
  29 | });
  30 | 
```