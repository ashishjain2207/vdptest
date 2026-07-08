import { test } from '../fixtures/test';
import { buildRegistrationData, uniqueEmail } from '../utils/dataFactory';
import { duplicateUsernameSeed } from '../utils/seed';
import validUserRegistrationData from '../test-data/auth/validUserRegistrationData.json';
import duplicateUsernameData from '../test-data/auth/duplicateUsernameData.json';

test.describe('registration', () => {
  test('Successful user registration with valid inputs', async ({ registrationPage, normalUserAuth }) => {
    const registrationData = buildRegistrationData(validUserRegistrationData);

    await registrationPage.goto();
    await registrationPage.register(registrationData);

    await registrationPage.expectRegistrationSucceeded();
    await registrationPage.expectNoValidationErrors();

    await normalUserAuth.page.context().clearCookies();
  });

  test('Registration fails with duplicate username', async ({ registrationPage }) => {
    const duplicateUsername = duplicateUsernameSeed();
    const registrationData = {
      fullName: duplicateUsernameData.fullName,
      username: duplicateUsername,
      email: uniqueEmail(duplicateUsernameData.emailPrefix, duplicateUsernameData.emailDomain),
      password: duplicateUsernameData.password,
      confirmPassword: duplicateUsernameData.password,
      dateOfBirth: duplicateUsernameData.dateOfBirth,
    };

    await registrationPage.goto();
    await registrationPage.register(registrationData);

    await registrationPage.expectDuplicateUsernameError();
    await registrationPage.expectOnRegistrationPage();
  });
});
