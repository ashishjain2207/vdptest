import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueEmail, uniqueUsername } from '../utils/randomData';

type RegistrationData = {
  name: string;
  usernamePrefix: string;
  emailPrefix: string;
  emailDomain: string;
  password: string;
  country: string;
};

test.describe('registration', () => {
  test('User Registration with Valid Data', async ({ registrationPage }) => {
    const data = loadTestData<RegistrationData>('validUserRegistration.json');

    await registrationPage.registerValidUser({
      name: data.name,
      username: uniqueUsername(data.usernamePrefix),
      email: uniqueEmail(data.emailPrefix, data.emailDomain),
      password: data.password,
      country: data.country,
    });

    await registrationPage.expectSuccessfulRegistration();
  });

  test('User Registration with Missing Required Fields', async ({ registrationPage }) => {
    await registrationPage.gotoRegistration();
    await registrationPage.submit();
    await registrationPage.expectRequiredFieldErrors();
  });

  test('User Registration with Duplicate Username', async ({ registrationPage, existingUserSetup, normalUserAuth }) => {
    test.skip(
      !process.env.E2E_EXISTING_USER_USERNAME && !normalUserAuth.username,
      'Set E2E_EXISTING_USER_USERNAME or E2E_NORMAL_USER_USERNAME for duplicate username validation.',
    );

    const data = loadTestData<RegistrationData>('validUserRegistration.json');
    await registrationPage.registerValidUser({
      name: data.name,
      username: existingUserSetup.username,
      email: uniqueEmail('e2e.duplicate', data.emailDomain),
      password: data.password,
      country: data.country,
    });

    await registrationPage.expectDuplicateUsernameError();
  });
});
