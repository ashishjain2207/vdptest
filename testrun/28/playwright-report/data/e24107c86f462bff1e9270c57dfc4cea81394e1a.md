# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> User searches for users, posts, and hashtags @medium
- Location: e2e/tests/search.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('@ashishjain')
Expected: visible
Error: strict mode violation: getByText('@ashishjain') resolved to 2 elements:
    1) <p class="text-xs text-muted-foreground truncate">@ashishjain</p> aka getByRole('complementary').getByText('@ashishjain')
    2) <p class="text-xs text-muted-foreground truncate">@ashishjain</p> aka getByText('@ashishjain').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('@ashishjain')
    4 × locator resolved to <p class="text-xs text-muted-foreground truncate">@ashishjain</p>
      - unexpected value "hidden"

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
            - link "Home" [ref=e11] [cursor=pointer]:
              - /url: /posts
              - img [ref=e12]
              - generic [ref=e15]: Home
          - listitem [ref=e16]:
            - link "Explore" [ref=e17] [cursor=pointer]:
              - /url: /explore
              - img [ref=e18]
              - generic [ref=e21]: Explore
          - listitem [ref=e22]:
            - link "People" [ref=e23] [cursor=pointer]:
              - /url: /people
              - img [ref=e24]
              - generic [ref=e29]: People
          - listitem [ref=e30]:
            - link "Partners" [ref=e31] [cursor=pointer]:
              - /url: /partners
              - img [ref=e32]
              - generic [ref=e36]: Partners
          - listitem [ref=e37]:
            - link "Events" [ref=e38] [cursor=pointer]:
              - /url: /events
              - img [ref=e39]
              - generic [ref=e41]: Events
          - listitem [ref=e42]:
            - link "Conversations" [ref=e43] [cursor=pointer]:
              - /url: /messages
              - img [ref=e44]
              - generic [ref=e46]: Conversations
          - listitem [ref=e47]:
            - link "Notifications" [ref=e48] [cursor=pointer]:
              - /url: /notifications
              - img [ref=e49]
              - generic [ref=e52]: Notifications
          - listitem [ref=e53]:
            - link "Saved posts" [ref=e54] [cursor=pointer]:
              - /url: /bookmarks
              - img [ref=e55]
              - generic [ref=e57]: Saved posts
          - listitem [ref=e58]:
            - link "Settings" [ref=e59] [cursor=pointer]:
              - /url: /settings
              - img [ref=e60]
              - generic [ref=e63]: Settings
    - generic [ref=e70]:
      - banner [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e74]:
            - img
            - textbox "Search posts and people …" [ref=e75]
          - generic [ref=e76]:
            - button "Create post" [ref=e77] [cursor=pointer]:
              - img
              - generic [ref=e78]: Create post
            - button "EN" [ref=e79] [cursor=pointer]:
              - text: EN
              - img
            - button "Notifications" [ref=e80] [cursor=pointer]:
              - img
            - link "Send feedback" [ref=e81] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e82]: Feedback
            - button "Ashish" [ref=e83] [cursor=pointer]:
              - img "Ashish" [ref=e85]
      - main [ref=e87]:
        - generic [ref=e89]:
          - generic [ref=e90]:
            - heading "Explore" [level=1] [ref=e91]
            - paragraph [ref=e92]: Explore the latest posts, people, and organizations in real estate.
          - generic [ref=e95]:
            - img
            - textbox "Search explore" [ref=e96]:
              - /placeholder: Search posts, people, or organizations …
              - text: ashishjain
            - button [ref=e97] [cursor=pointer]:
              - img
          - generic [ref=e98]:
            - generic [ref=e99]:
              - heading "Results for \"ashishjain\"" [level=2] [ref=e100]
              - button "Save search" [ref=e101] [cursor=pointer]:
                - img
                - generic [ref=e102]: Save search
            - generic [ref=e103]:
              - tablist [ref=e104]:
                - tab "Posts 0" [ref=e105] [cursor=pointer]:
                  - generic [ref=e106]: Posts
                  - generic [ref=e107]: "0"
                - tab "People 0" [active] [selected] [ref=e108] [cursor=pointer]:
                  - generic [ref=e109]: People
                  - generic [ref=e110]: "0"
                - tab "Orgs 0" [ref=e111] [cursor=pointer]:
                  - generic [ref=e112]: Orgs
                  - generic [ref=e113]: "0"
              - tabpanel "People 0"
        - generic [ref=e114]:
          - navigation "Legal" [ref=e115]:
            - link "Terms of Use" [ref=e116] [cursor=pointer]:
              - /url: /terms
            - link "Privacy Policy" [ref=e117] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie Policy" [ref=e118] [cursor=pointer]:
              - /url: /cookie
            - link "Accessibility Statement" [ref=e119] [cursor=pointer]:
              - /url: /accessibility
            - link "Legal Notice" [ref=e120] [cursor=pointer]:
              - /url: /impressum
            - link "Support" [ref=e121] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e122]: © 2026 vdpResearch GmbH. All rights reserved.
```

# Test source

```ts
  1  | import { EditProfilePage } from '../pages/EditProfilePage';
  2  | import { LoginPage } from '../pages/LoginPage';
  3  | import { expect, loginWithDefaultUser, test } from '../fixtures/test';
  4  | 
  5  | test('User searches for users, posts, and hashtags @medium', async ({ page }) => {
  6  |   const loginPage = new LoginPage(page);
  7  |   const editProfilePage = new EditProfilePage(page);
  8  | 
  9  |   await loginWithDefaultUser(page, loginPage);
  10 |   await editProfilePage.open();
  11 |   const existingHandle = (await editProfilePage.handleInput.inputValue()).trim();
  12 | 
  13 |   await page.goto('/explore');
  14 |   const headerSearch = page.getByTestId('header-global-search');
  15 |   await expect(headerSearch).toBeVisible();
  16 |   await headerSearch.fill(existingHandle);
  17 |   await headerSearch.press('Enter');
  18 | 
  19 |   await expect(page).toHaveURL(new RegExp(`/explore\\?q=${existingHandle}`, 'i'));
  20 |   await page.getByRole('tab', { name: /^People\b/i }).click();
> 21 |   await expect(page.getByText(`@${existingHandle}`, { exact: false })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  22 | 
  23 |   await page.goto('/explore');
  24 |   const firstHashtagLink = page.locator('a[href^="/explore/tag/"]').first();
  25 |   await expect(firstHashtagLink).toBeVisible();
  26 |   await firstHashtagLink.click();
  27 | 
  28 |   await expect(page).toHaveURL(/\/explore\/tag\//);
  29 |   await expect(page.getByLabel('Explore posts results')).toBeVisible();
  30 | });
  31 | 
```