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
    6 × locator resolved to <p class="text-xs text-muted-foreground truncate">@ashishjain</p>
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
      - generic [ref=e65] [cursor=pointer]:
        - img "Ashish" [ref=e67]
        - generic [ref=e68]:
          - paragraph [ref=e69]: Ashish
          - paragraph [ref=e70]: "@ashishjain"
        - img [ref=e71]
    - generic [ref=e74]:
      - banner [ref=e75]:
        - generic [ref=e76]:
          - generic [ref=e78]:
            - img
            - textbox "Search posts and people …" [ref=e79]
          - generic [ref=e80]:
            - button "Create post" [ref=e81] [cursor=pointer]:
              - img
              - generic [ref=e82]: Create post
            - button "EN" [ref=e83] [cursor=pointer]:
              - text: EN
              - img
            - button "Notifications" [ref=e84] [cursor=pointer]:
              - img
            - link "Send feedback" [ref=e85] [cursor=pointer]:
              - /url: /support?type=feedback
              - img
              - generic [ref=e86]: Feedback
            - button "Ashish" [ref=e87] [cursor=pointer]:
              - img "Ashish" [ref=e89]
      - main [ref=e91]:
        - generic [ref=e93]:
          - generic [ref=e94]:
            - heading "Explore" [level=1] [ref=e95]
            - paragraph [ref=e96]: Explore the latest posts, people, and organizations in real estate.
          - generic [ref=e99]:
            - img
            - textbox "Search explore" [ref=e100]:
              - /placeholder: Search posts, people, or organizations …
              - text: ashishjain
            - button [ref=e101] [cursor=pointer]:
              - img
          - generic [ref=e102]:
            - generic [ref=e103]:
              - heading "Results for \"ashishjain\"" [level=2] [ref=e104]
              - button "Save search" [ref=e105] [cursor=pointer]:
                - img
                - generic [ref=e106]: Save search
            - generic [ref=e107]:
              - tablist [ref=e108]:
                - tab "Posts 0" [ref=e109] [cursor=pointer]:
                  - generic [ref=e110]: Posts
                  - generic [ref=e111]: "0"
                - tab "People 0" [active] [selected] [ref=e112] [cursor=pointer]:
                  - generic [ref=e113]: People
                  - generic [ref=e114]: "0"
                - tab "Orgs 0" [ref=e115] [cursor=pointer]:
                  - generic [ref=e116]: Orgs
                  - generic [ref=e117]: "0"
              - tabpanel "People 0"
        - generic [ref=e118]:
          - navigation "Legal" [ref=e119]:
            - link "Terms of Use" [ref=e120] [cursor=pointer]:
              - /url: /terms
            - link "Privacy Policy" [ref=e121] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie Policy" [ref=e122] [cursor=pointer]:
              - /url: /cookie
            - link "Accessibility Statement" [ref=e123] [cursor=pointer]:
              - /url: /accessibility
            - link "Legal Notice" [ref=e124] [cursor=pointer]:
              - /url: /impressum
            - link "Support" [ref=e125] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e126]: © 2026 vdpResearch GmbH. All rights reserved.
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