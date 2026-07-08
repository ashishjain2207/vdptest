import { test, expect } from '../fixtures/test';
import { buildRegistrationUser, getDuplicateUsernameData } from '../utils/dataFactory';

test.describe('registration', () => {
  test.fixme(
    'Successful user registration with valid inputs',
    'The current app signup flow omits DOB, confirm-password, and terms fields and redirects back to login for email verification instead of onboarding/home feed.',
  );

  test('Registration fails with duplicate username', async ({ env, registrationPage }) => {
    test.skip(
      env.registrationEmailDomain === 'example.test',
      'Duplicate-username coverage needs E2E_REGISTRATION_EMAIL_DOMAIN set to a real disposable test domain.',
    );

    const duplicate = getDuplicateUsernameData();
    const firstAttempt = buildRegistrationUser();
    const secondAttempt = buildRegistrationUser();

    firstAttempt.handle = duplicate.username;
    firstAttempt.name = duplicate.fullName;
    firstAttempt.password = duplicate.passwordFallback;

    secondAttempt.handle = duplicate.username;
    secondAttempt.name = `${duplicate.fullName} Retry`;
    secondAttempt.password = duplicate.passwordFallback;

    await registrationPage.goto();
    await registrationPage.expectLoaded();
    await registrationPage.fillForm(firstAttempt);
    await registrationPage.submit();

    await registrationPage.goto();
    await registrationPage.expectLoaded();
    await registrationPage.fillForm(secondAttempt);
    await registrationPage.submit();

    await expect(registrationPage.page).toHaveURL(/\/signup$/);
    await expect(registrationPage.usernameError).toBeVisible();
  });
});
