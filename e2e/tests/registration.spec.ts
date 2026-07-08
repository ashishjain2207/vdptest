import { test, expect } from '../fixtures/test';
import { buildRegistrationUser } from '../utils/dataFactory';

test.describe('registration', () => {
  test('shows validation feedback for required signup fields', async ({ registrationPage }) => {
    await registrationPage.goto();
    await registrationPage.expectLoaded();

    await registrationPage.submit();

    await expect(registrationPage.usernameError).toBeVisible();
    await expect(registrationPage.page).toHaveURL(/\/signup$/);
  });

  test('submits registration and returns to login when a disposable domain is configured', async ({ env, registrationPage, loginPage }) => {
    test.skip(
      env.registrationEmailDomain === 'example.test',
      'Successful signup needs E2E_REGISTRATION_EMAIL_DOMAIN set to a real disposable test domain.',
    );

    const user = buildRegistrationUser();

    await registrationPage.goto();
    await registrationPage.expectLoaded();
    await registrationPage.fillForm(user);
    await registrationPage.submit();

    await loginPage.expectLoaded();
    await expect(registrationPage.page).toHaveURL(/\/login$/);
  });

  test.fixme(
    'legacy signup fields for DOB, confirm password, and terms do not exist in the current app',
    'The current /signup form only exposes name, username, home country, email, and password.',
  );
});
