# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edit-profile.spec.ts >> User updates profile information and cancels an unsaved edit @medium
- Location: e2e/tests/edit-profile.spec.ts:5:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#location')

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
          - heading "Settings" [level=1] [ref=e94]
          - generic [ref=e95]:
            - generic [ref=e97]:
              - link "Profile" [ref=e98] [cursor=pointer]:
                - /url: /settings/profile
                - img [ref=e99]
                - generic [ref=e102]: Profile
              - link "Account" [ref=e103] [cursor=pointer]:
                - /url: /settings/account
                - img [ref=e104]
                - generic [ref=e107]: Account
              - button "Log out" [ref=e108] [cursor=pointer]:
                - img [ref=e109]
                - generic [ref=e112]: Log out
            - generic [ref=e114]:
              - generic [ref=e115]:
                - heading "Edit profile" [level=2] [ref=e116]
                - paragraph [ref=e117]: Manage the information shown on your profile.
              - generic [ref=e118]:
                - generic [ref=e119]:
                  - generic [ref=e120]: Cover Image
                  - generic [ref=e121]:
                    - img "Cover" [ref=e123]
                    - generic [ref=e124]:
                      - button "Change" [ref=e125] [cursor=pointer]:
                        - img
                        - generic [ref=e126]: Change
                      - button "Remove" [ref=e127] [cursor=pointer]:
                        - generic [ref=e128]: Remove
                - generic [ref=e129]:
                  - generic [ref=e130]:
                    - img "E2E Updated Name 1784184443777" [ref=e132]
                    - button [ref=e133] [cursor=pointer]:
                      - img [ref=e134]
                  - generic [ref=e137]:
                    - paragraph [ref=e138]: Profile picture
                    - generic [ref=e139]:
                      - button "Change" [ref=e140] [cursor=pointer]:
                        - generic [ref=e141]: Change
                      - button "Remove" [ref=e142] [cursor=pointer]:
                        - generic [ref=e143]: Remove
                - generic [ref=e145]:
                  - generic [ref=e146]: Country
                  - combobox "Home country" [disabled] [ref=e149]: Canada
                - generic [ref=e150]:
                  - generic [ref=e151]:
                    - generic [ref=e152]: Display Name
                    - textbox "Display Name" [ref=e153]:
                      - /placeholder: Your display name
                      - text: E2E Updated Name 1784184443777
                  - generic [ref=e154]:
                    - generic [ref=e155]: Username
                    - generic [ref=e156]:
                      - generic [ref=e157]: "@"
                      - textbox "Username" [ref=e158]:
                        - /placeholder: username
                        - text: ashishjain
                  - generic [ref=e159]:
                    - generic [ref=e160]: Short bio
                    - textbox "Short bio" [active] [ref=e161]:
                      - /placeholder: Tell people about yourself...
                      - text: E2E updated bio 1784184443777
                  - generic [ref=e162]:
                    - generic [ref=e163]:
                      - generic [ref=e165]: Company/Organization
                      - textbox "Company/Organization" [ref=e167]:
                        - /placeholder: Enter your company or organization
                    - generic [ref=e168]:
                      - generic [ref=e170]: Title/Position
                      - generic [ref=e171]:
                        - textbox "Title/Position" [ref=e172]:
                          - /placeholder: Enter or select title/position …
                        - img
                  - generic [ref=e173]:
                    - generic [ref=e174]: Location
                    - generic [ref=e175]:
                      - button "Use current location" [ref=e176] [cursor=pointer]:
                        - img
                        - generic [ref=e177]: Use current location
                      - textbox "Search for a location" [ref=e179]:
                        - /placeholder: Search city, address or location …
                  - generic [ref=e180]:
                    - generic [ref=e181]: Contact email address
                    - textbox "Contact email address" [ref=e182]:
                      - /placeholder: you@example.com
                      - text: ashish.jain@imriva.de
                  - generic [ref=e183]:
                    - generic [ref=e184]: LinkedIn profile
                    - textbox "LinkedIn profile" [ref=e185]:
                      - /placeholder: https://linkedin.com/in/yourprofile
                  - generic [ref=e186]:
                    - generic [ref=e187]: About me
                    - textbox "About me" [ref=e188]:
                      - /placeholder: Describe your experience, focus areas, and interests.
                  - generic [ref=e189]:
                    - generic [ref=e190]: Website
                    - textbox "Website" [ref=e191]:
                      - /placeholder: https://yourwebsite.com
                - generic [ref=e192]:
                  - button "Cancel" [ref=e193] [cursor=pointer]:
                    - generic [ref=e194]: Cancel
                  - button "Save changes" [ref=e195] [cursor=pointer]
        - generic [ref=e196]:
          - navigation "Legal" [ref=e197]:
            - link "Terms of Use" [ref=e198] [cursor=pointer]:
              - /url: /terms
            - link "Privacy Policy" [ref=e199] [cursor=pointer]:
              - /url: /privacy
            - link "Cookie Policy" [ref=e200] [cursor=pointer]:
              - /url: /cookie
            - link "Accessibility Statement" [ref=e201] [cursor=pointer]:
              - /url: /accessibility
            - link "Legal Notice" [ref=e202] [cursor=pointer]:
              - /url: /impressum
            - link "Support" [ref=e203] [cursor=pointer]:
              - /url: /support?type=support
          - paragraph [ref=e204]: © 2026 vdpResearch GmbH. All rights reserved.
```

# Test source

```ts
  1  | import { EditProfilePage } from '../pages/EditProfilePage';
  2  | import { LoginPage } from '../pages/LoginPage';
  3  | import { expect, loginWithDefaultUser, test } from '../fixtures/test';
  4  | 
  5  | test('User updates profile information and cancels an unsaved edit @medium', async ({ page }) => {
  6  |   const loginPage = new LoginPage(page);
  7  |   const editProfilePage = new EditProfilePage(page);
  8  | 
  9  |   await loginWithDefaultUser(page, loginPage);
  10 |   await editProfilePage.open();
  11 | 
  12 |   const marker = Date.now();
  13 |   const updatedName = `E2E Updated Name ${marker}`;
  14 |   const updatedBio = `E2E updated bio ${marker}`;
  15 |   const updatedLocation = `Berlin ${marker}`;
  16 |   const updatedWebsite = `https://example.test/profile-${marker}`;
  17 | 
  18 |   await editProfilePage.nameInput.fill(updatedName);
  19 |   await editProfilePage.bioInput.fill(updatedBio);
> 20 |   await editProfilePage.locationInput.fill(updatedLocation);
     |                                       ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  21 |   await page.locator('#website').fill(updatedWebsite);
  22 | 
  23 |   const actionButtons = page.locator('div.flex.justify-end.gap-3 button');
  24 |   const cancelButton = actionButtons.nth(0);
  25 |   const saveButton = actionButtons.nth(1);
  26 | 
  27 |   await saveButton.click();
  28 |   await expect(editProfilePage.bioInput).toHaveValue(updatedBio);
  29 | 
  30 |   const profileHandle = (await editProfilePage.handleInput.inputValue()).trim();
  31 |   if (profileHandle) {
  32 |     await page.goto(`/profile/${profileHandle}`);
  33 |     await expect(page.locator('main')).toContainText(updatedBio);
  34 |   }
  35 | 
  36 |   await editProfilePage.open();
  37 |   const unsavedBio = `E2E unsaved bio ${marker}`;
  38 |   await editProfilePage.bioInput.fill(unsavedBio);
  39 |   await cancelButton.click();
  40 |   await expect(editProfilePage.bioInput).toHaveValue(updatedBio);
  41 | });
  42 | 
  43 | test('Edit Profile rejects invalid required, URL, length, and image values @medium', async () => {
  44 |   test.skip(
  45 |     true,
  46 |     'Missing selector in src/: explicit field-level validation selectors for invalid URL/length/image errors are not provided in scoped selector sources',
  47 |   );
  48 | });
  49 | 
```