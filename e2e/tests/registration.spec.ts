import { AccountSettingsPage } from '../pages/AccountSettingsPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { expect, loginWithDefaultUser, requireEnv, test } from '../fixtures/test';

const VALID_PASSWORD = 'Abcd1234!';
const HOME_COUNTRY_LABEL = 'Germany';

function buildUniqueRegistrationIdentity(existingEmail?: string) {
  const stamp = Date.now();
  const [localPart = 'user', domain = 'example.test'] = (existingEmail ?? '').split('@');
  const sanitizedLocal = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';

  return {
    email: `${sanitizedLocal}.e2e.${stamp}@${domain || 'example.test'}`,
    username: `e2euser${stamp}`.slice(0, 30),
    name: `E2E User ${stamp}`,
  };
}

test('New user registers with valid required information @high', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);
  const loginPage = new LoginPage(page);
  const identity = buildUniqueRegistrationIdentity(requireEnv('E2E_USER_EMAIL'));

  await registrationPage.open();
  await registrationPage.fillRequiredValues({
    name: identity.name,
    username: identity.username,
    homeCountry: HOME_COUNTRY_LABEL,
    email: identity.email,
    password: VALID_PASSWORD,
  });
  await registrationPage.submit();

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
});

test('Registration rejects missing and malformed required values @high', async ({ page }) => {
  const registrationPage = new RegistrationPage(page);

  await registrationPage.open();
  await registrationPage.submit();

  await expect(registrationPage.nameInput).toHaveAttribute('aria-describedby', 'signup-name-err');
  await expect(registrationPage.usernameInput).toHaveAttribute('aria-describedby', 'signup-username-err');
  await expect(registrationPage.homeCountryInput).toHaveAttribute('aria-describedby', 'signup-home-country-err');
  await expect(registrationPage.emailInput).toHaveAttribute('aria-describedby', 'signup-email-err');
  await expect(registrationPage.passwordInput).toHaveAttribute('aria-describedby', 'signup-password-err');

  await registrationPage.nameInput.fill('E2E Validation');
  await registrationPage.usernameInput.fill('invalid handle!');
  await registrationPage.homeCountryInput.fill('Atlantis');
  await registrationPage.emailInput.fill('not-an-email');
  await registrationPage.passwordInput.fill('weak');
  await registrationPage.submit();

  await expect(registrationPage.usernameInput).toHaveAttribute('aria-describedby', 'signup-username-err');
  await expect(registrationPage.homeCountryInput).toHaveAttribute('aria-describedby', 'signup-home-country-err');
  await expect(registrationPage.passwordInput).toHaveAttribute('aria-describedby', 'signup-password-err');
  await expect(page).toHaveURL(/\/signup(?:\?|$)/);
});

test('Registration rejects duplicate username and email @high', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const editProfilePage = new EditProfilePage(page);
  const accountSettingsPage = new AccountSettingsPage(page);
  const registrationPage = new RegistrationPage(page);
  const existingEmail = requireEnv('E2E_USER_EMAIL');
  const identity = buildUniqueRegistrationIdentity(existingEmail);

  await loginWithDefaultUser(page, loginPage);
  await editProfilePage.open();
  const existingHandle = (await editProfilePage.handleInput.inputValue()).trim();

  await accountSettingsPage.open();
  await accountSettingsPage.logoutButton.click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);

  await registrationPage.open();
  await registrationPage.fillRequiredValues({
    name: identity.name,
    username: existingHandle,
    homeCountry: HOME_COUNTRY_LABEL,
    email: existingEmail,
    password: VALID_PASSWORD,
  });
  await registrationPage.submit();

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(loginPage.emailInput).toBeVisible();
});
