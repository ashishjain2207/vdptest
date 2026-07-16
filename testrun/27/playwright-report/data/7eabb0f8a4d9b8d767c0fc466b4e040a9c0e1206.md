# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.ts >> Registration rejects duplicate username and email @high
- Location: e2e/tests/registration.spec.ts:67:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login(?:\?|$)/
Received string:  "https://dev.app.vdpconnect.idxd.de/signup"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    24 × unexpected value "https://dev.app.vdpconnect.idxd.de/signup"

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- button "EN":
  - text: EN
  - img
- img "vdpConnect logo"
- heading "The network for real estate professionals." [level=1]
- paragraph: Connect with real estate professionals, share insights, and discover new business opportunities.
- heading "Create your account and become part of the network." [level=2]
- button "Microsoft"
- text: Or sign up with email Name
- img
- textbox "Name":
  - /placeholder: e.g. John Smith
  - text: E2E User 1784184772541
- text: Username
- img
- textbox "Username" [invalid]:
  - /placeholder: e.g. johndoe
  - text: ashishjain
- img
- alert: This username is already in use. Please choose another.
- text: Country (Required for email registration)
- combobox "Country (Required for email registration)": Germany
- text: Business email address
- img
- textbox "Business email address":
  - /placeholder: you@company.com
  - text: ashish.jain@imriva.de
- text: Password
- img
- textbox "Password":
  - /placeholder: Create password
  - text: Abcd1234!
- button "Show password":
  - img
- paragraph: At least 8 characters
- paragraph: One uppercase letter
- paragraph: One lowercase letter
- paragraph: One number
- paragraph: "One special character (@, #, etc.)"
- button "Create free account" [disabled]
- paragraph:
  - text: By registering, you agree to our
  - link "Terms of Use":
    - /url: /terms
  - text: ","
  - link "Privacy Policy":
    - /url: /privacy
  - text: ","
  - link "Cookie Policy":
    - /url: /cookie
  - text: ","
  - link "Accessibility Statement":
    - /url: /accessibility
  - text: ", and"
  - link "Legal Notice":
    - /url: /impressum
  - text: .
- paragraph:
  - text: Already registered?
  - link "Sign in":
    - /url: /login
- link "Support":
  - /url: /support?type=support
```

# Test source

```ts
  1  | import { AccountSettingsPage } from '../pages/AccountSettingsPage';
  2  | import { EditProfilePage } from '../pages/EditProfilePage';
  3  | import { LoginPage } from '../pages/LoginPage';
  4  | import { RegistrationPage } from '../pages/RegistrationPage';
  5  | import { expect, loginWithDefaultUser, requireEnv, test } from '../fixtures/test';
  6  | 
  7  | const VALID_PASSWORD = 'Abcd1234!';
  8  | const HOME_COUNTRY_LABEL = 'Germany';
  9  | 
  10 | function buildUniqueRegistrationIdentity(existingEmail?: string) {
  11 |   const stamp = Date.now();
  12 |   const [localPart = 'user', domain = 'example.test'] = (existingEmail ?? '').split('@');
  13 |   const sanitizedLocal = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
  14 | 
  15 |   return {
  16 |     email: `${sanitizedLocal}.e2e.${stamp}@${domain || 'example.test'}`,
  17 |     username: `e2euser${stamp}`.slice(0, 30),
  18 |     name: `E2E User ${stamp}`,
  19 |   };
  20 | }
  21 | 
  22 | test('New user registers with valid required information @high', async ({ page }) => {
  23 |   const registrationPage = new RegistrationPage(page);
  24 |   const loginPage = new LoginPage(page);
  25 |   const identity = buildUniqueRegistrationIdentity(requireEnv('E2E_USER_EMAIL'));
  26 | 
  27 |   await registrationPage.open();
  28 |   await registrationPage.fillRequiredValues({
  29 |     name: identity.name,
  30 |     username: identity.username,
  31 |     homeCountry: HOME_COUNTRY_LABEL,
  32 |     email: identity.email,
  33 |     password: VALID_PASSWORD,
  34 |   });
  35 |   await registrationPage.submit();
  36 | 
  37 |   await expect(page).toHaveURL(/\/login(?:\?|$)/);
  38 |   await expect(loginPage.emailInput).toBeVisible();
  39 |   await expect(loginPage.passwordInput).toBeVisible();
  40 | });
  41 | 
  42 | test('Registration rejects missing and malformed required values @high', async ({ page }) => {
  43 |   const registrationPage = new RegistrationPage(page);
  44 | 
  45 |   await registrationPage.open();
  46 |   await registrationPage.submit();
  47 | 
  48 |   await expect(registrationPage.nameInput).toHaveAttribute('aria-describedby', 'signup-name-err');
  49 |   await expect(registrationPage.usernameInput).toHaveAttribute('aria-describedby', 'signup-username-err');
  50 |   await expect(registrationPage.homeCountryInput).toHaveAttribute('aria-describedby', 'signup-home-country-err');
  51 |   await expect(registrationPage.emailInput).toHaveAttribute('aria-describedby', 'signup-email-err');
  52 |   await expect(registrationPage.passwordInput).toHaveAttribute('aria-describedby', 'signup-password-err');
  53 | 
  54 |   await registrationPage.nameInput.fill('E2E Validation');
  55 |   await registrationPage.usernameInput.fill('invalid handle!');
  56 |   await registrationPage.homeCountryInput.fill('Atlantis');
  57 |   await registrationPage.emailInput.fill('not-an-email');
  58 |   await registrationPage.passwordInput.fill('weak');
  59 |   await registrationPage.submit();
  60 | 
  61 |   await expect(registrationPage.usernameInput).toHaveAttribute('aria-describedby', 'signup-username-err');
  62 |   await expect(registrationPage.homeCountryInput).toHaveAttribute('aria-describedby', 'signup-home-country-err');
  63 |   await expect(registrationPage.passwordInput).toHaveAttribute('aria-describedby', 'signup-password-err');
  64 |   await expect(page).toHaveURL(/\/signup(?:\?|$)/);
  65 | });
  66 | 
  67 | test('Registration rejects duplicate username and email @high', async ({ page }) => {
  68 |   const loginPage = new LoginPage(page);
  69 |   const editProfilePage = new EditProfilePage(page);
  70 |   const accountSettingsPage = new AccountSettingsPage(page);
  71 |   const registrationPage = new RegistrationPage(page);
  72 |   const existingEmail = requireEnv('E2E_USER_EMAIL');
  73 |   const identity = buildUniqueRegistrationIdentity(existingEmail);
  74 | 
  75 |   await loginWithDefaultUser(page, loginPage);
  76 |   await editProfilePage.open();
  77 |   const existingHandle = (await editProfilePage.handleInput.inputValue()).trim();
  78 | 
  79 |   await accountSettingsPage.open();
  80 |   await accountSettingsPage.logoutButton.click();
  81 |   await expect(page).toHaveURL(/\/login(?:\?|$)/);
  82 | 
  83 |   await registrationPage.open();
  84 |   await registrationPage.fillRequiredValues({
  85 |     name: identity.name,
  86 |     username: existingHandle,
  87 |     homeCountry: HOME_COUNTRY_LABEL,
  88 |     email: existingEmail,
  89 |     password: VALID_PASSWORD,
  90 |   });
  91 |   await registrationPage.submit();
  92 | 
> 93 |   await expect(page).toHaveURL(/\/login(?:\?|$)/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  94 |   await expect(loginPage.emailInput).toBeVisible();
  95 | });
  96 | 
```