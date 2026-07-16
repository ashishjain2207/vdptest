# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.ts >> Registration rejects missing and malformed required values @high
- Location: e2e/tests/registration.spec.ts:42:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('form button[type="submit"]')
    - locator resolved to <button disabled type="submit" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-secondary px-4 py-2 w-full h-11 shadow-soft mt-1">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    111 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - button "EN" [ref=e5] [cursor=pointer]:
      - text: EN
      - img
    - generic [ref=e11]:
      - img "vdpConnect logo" [ref=e13]
      - heading "The network for real estate professionals." [level=1] [ref=e14]
      - paragraph [ref=e15]: Connect with real estate professionals, share insights, and discover new business opportunities.
    - generic [ref=e17]:
      - heading "Create your account and become part of the network." [level=2] [ref=e19]
      - generic [ref=e20]:
        - button "Microsoft" [ref=e22] [cursor=pointer]:
          - img
          - text: Microsoft
        - generic [ref=e24]: Or sign up with email
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]: Name *
          - generic [ref=e28]:
            - img [ref=e29]
            - textbox "Name" [ref=e32]:
              - /placeholder: e.g. John Smith
              - text: E2E Validation
        - generic [ref=e33]:
          - generic [ref=e34]: Username *
          - generic [ref=e35]:
            - img [ref=e36]
            - textbox "Username" [ref=e39]:
              - /placeholder: e.g. johndoe
              - text: invalid handle!
        - generic [ref=e40]:
          - generic [ref=e41]:
            - text: Country *
            - generic [ref=e42]: (Required for email registration)
          - generic [ref=e43]:
            - combobox "Country (Required for email registration)" [expanded] [invalid] [ref=e44]: Atlantis
            - listbox [ref=e45]:
              - listitem [ref=e46]: Search results
              - listitem [ref=e47]: No supported country found.
          - alert [ref=e48]: Please select your country.
        - generic [ref=e49]:
          - generic [ref=e50]: Business email address *
          - generic [ref=e51]:
            - img [ref=e52]
            - textbox "Business email address" [ref=e55]:
              - /placeholder: you@company.com
              - text: not-an-email
        - generic [ref=e56]:
          - generic [ref=e57]: Password *
          - generic [ref=e58]:
            - img [ref=e59]
            - textbox "Password" [active] [invalid] [ref=e62]:
              - /placeholder: Create password
              - text: weak
            - button "Show password" [ref=e63] [cursor=pointer]:
              - img [ref=e64]
          - generic [ref=e67]:
            - paragraph [ref=e68]:
              - img [ref=e69]
              - text: At least 8 characters
            - paragraph [ref=e73]:
              - img [ref=e74]
              - text: One uppercase letter
            - paragraph [ref=e78]:
              - img [ref=e79]
              - text: One lowercase letter
            - paragraph [ref=e82]:
              - img [ref=e83]
              - text: One number
            - paragraph [ref=e87]:
              - img [ref=e88]
              - text: "One special character (@, #, etc.)"
        - button "Create free account" [disabled]:
          - generic: Create free account
        - paragraph [ref=e92]:
          - text: By registering, you agree to our
          - link "Terms of Use" [ref=e93] [cursor=pointer]:
            - /url: /terms
          - text: ","
          - link "Privacy Policy" [ref=e94] [cursor=pointer]:
            - /url: /privacy
          - text: ","
          - link "Cookie Policy" [ref=e95] [cursor=pointer]:
            - /url: /cookie
          - text: ","
          - link "Accessibility Statement" [ref=e96] [cursor=pointer]:
            - /url: /accessibility
          - text: ", and"
          - link "Legal Notice" [ref=e97] [cursor=pointer]:
            - /url: /impressum
          - text: .
      - paragraph [ref=e98]:
        - text: Already registered?
        - link "Sign in" [ref=e99] [cursor=pointer]:
          - /url: /login
    - link "Support" [ref=e100] [cursor=pointer]:
      - /url: /support?type=support
      - img [ref=e101]
      - generic [ref=e104]: Support
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | 
  3  | export interface RegistrationRequiredInput {
  4  |   name: string;
  5  |   username: string;
  6  |   homeCountry: string;
  7  |   email: string;
  8  |   password: string;
  9  | }
  10 | 
  11 | function escapeRegex(value: string): string {
  12 |   return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  13 | }
  14 | 
  15 | export class RegistrationPage {
  16 |   readonly page: Page;
  17 |   readonly nameInput: Locator;
  18 |   readonly usernameInput: Locator;
  19 |   readonly homeCountryInput: Locator;
  20 |   readonly emailInput: Locator;
  21 |   readonly passwordInput: Locator;
  22 |   readonly submitButton: Locator;
  23 |   readonly nameError: Locator;
  24 |   readonly usernameError: Locator;
  25 |   readonly homeCountryError: Locator;
  26 |   readonly emailError: Locator;
  27 |   readonly passwordError: Locator;
  28 | 
  29 |   constructor(page: Page) {
  30 |     this.page = page;
  31 |     this.nameInput = page.locator('#name');
  32 |     this.usernameInput = page.locator('#username');
  33 |     this.homeCountryInput = page.locator('#signup-home-country');
  34 |     this.emailInput = page.locator('#email');
  35 |     this.passwordInput = page.locator('#password');
  36 |     this.submitButton = page.locator('form button[type="submit"]');
  37 |     this.nameError = page.locator('#signup-name-err');
  38 |     this.usernameError = page.locator('#signup-username-err');
  39 |     this.homeCountryError = page.locator('#signup-home-country-err');
  40 |     this.emailError = page.locator('#signup-email-err');
  41 |     this.passwordError = page.locator('#signup-password-err');
  42 |   }
  43 | 
  44 |   async open(): Promise<void> {
  45 |     await this.page.goto('/signup');
  46 |     await expect(this.nameInput).toBeVisible();
  47 |     await expect(this.usernameInput).toBeVisible();
  48 |     await expect(this.homeCountryInput).toBeVisible();
  49 |     await expect(this.emailInput).toBeVisible();
  50 |     await expect(this.passwordInput).toBeVisible();
  51 |     await expect(this.submitButton).toBeVisible();
  52 |   }
  53 | 
  54 |   async fillRequiredValues(data: RegistrationRequiredInput): Promise<void> {
  55 |     await this.nameInput.fill(data.name);
  56 |     await this.usernameInput.fill(data.username);
  57 |     await this.selectHomeCountry(data.homeCountry);
  58 |     await this.emailInput.fill(data.email);
  59 |     await this.passwordInput.fill(data.password);
  60 |   }
  61 | 
  62 |   async selectHomeCountry(label: string): Promise<void> {
  63 |     const option = this.page.getByRole('option', {
  64 |       name: new RegExp(`^${escapeRegex(label)}$`, 'i'),
  65 |     });
  66 | 
  67 |     await this.homeCountryInput.click();
  68 |     await this.homeCountryInput.fill(label);
  69 |     await expect(option).toBeVisible();
  70 |     await option.click();
  71 |     await expect(this.homeCountryInput).toHaveValue(new RegExp(`^${escapeRegex(label)}$`, 'i'));
  72 |   }
  73 | 
  74 |   async submit(): Promise<void> {
> 75 |     await this.submitButton.click();
     |                             ^ Error: locator.click: Test timeout of 60000ms exceeded.
  76 |   }
  77 | }
  78 | 
```