import { test, expect } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueDisplayName, uniqueEmail, uniqueUsername } from '../utils/randomData';
import type { RegistrationInput } from '../pages/RegistrationPage';

type RegistrationData = {
  displayNamePrefix: string;
  usernamePrefix: string;
  emailPrefix: string;
  emailDomain: string;
  homeCountry: string;
  password: string;
};

test.describe('registration', () => {
  test('User Registration with Valid Data', async ({ registrationPage }) => {
    const data = loadTestData<RegistrationData>('validUserRegistration.json');
    const input: RegistrationInput = {
      displayName: uniqueDisplayName(data.displayNamePrefix),
      username: uniqueUsername(data.usernamePrefix),
      email: uniqueEmail(data.emailPrefix, data.emailDomain),
      homeCountry: data.homeCountry,
      password: data.password,
    };

    await registrationPage.register(input);
    await registrationPage.expectSuccessfulRegistration();
  });

  test('User Registration with Missing Required Fields', async ({ registrationPage }) => {
    await registrationPage.open();
    await registrationPage.submit();
    await registrationPage.expectMissingRequiredFields();
  });

  test('User Registration with Duplicate Username', async ({ registrationPage, existingUserSetup }) => {
    test.skip(!existingUserSetup.username, 'Set VDP_E2E_EXISTING_USER_USERNAME for duplicate username validation.');

    const data = loadTestData<RegistrationData>('validUserRegistration.json');
    await registrationPage.register({
      displayName: uniqueDisplayName(data.displayNamePrefix),
      username: existingUserSetup.username,
      email: uniqueEmail(data.emailPrefix, data.emailDomain),
      homeCountry: data.homeCountry,
      password: data.password,
    });

    await registrationPage.expectDuplicateUsernameError();
    await expect(registrationPage.usernameInput).toHaveValue(existingUserSetup.username);
  });
});
