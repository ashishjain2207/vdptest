import { test, expect } from '../fixtures/test.fixture';
import { uniqueEmail, uniqueRegistrationData } from '../utils/randomData';
import { loadTestData } from '../utils/testDataLoader';

type RegistrationTemplate = {
  displayName: string;
  usernamePrefix?: string;
  emailPrefix?: string;
  emailDomain?: string;
  password: string;
  country: string;
};

test.describe('User registration', () => {
  test('User Registration with Valid Data', async ({ registrationPage }) => {
    const template = loadTestData<RegistrationTemplate>('validUserRegistration.json');
    const data = uniqueRegistrationData({
      displayName: template.displayName,
      password: template.password,
      country: template.country,
    });

    await registrationPage.gotoRegistration();
    await registrationPage.register(data);
    await registrationPage.expectRegistrationSuccess();
  });

  test('User Registration with Missing Required Fields', async ({ registrationPage }) => {
    await registrationPage.gotoRegistration();
    await registrationPage.submit();
    await registrationPage.expectRequiredFieldValidation();
    await expect(registrationPage.page).toHaveURL(/\/signup/);
  });

  test('User Registration with Duplicate Username', async ({ registrationPage, existingUserSetup }) => {
    const template = loadTestData<RegistrationTemplate>('duplicateUsername.json');
    const data = uniqueRegistrationData({
      displayName: template.displayName,
      username: existingUserSetup.username,
      email: uniqueEmail(template.emailPrefix, template.emailDomain),
      password: template.password,
      country: template.country,
    });

    await registrationPage.gotoRegistration();
    await registrationPage.register(data);
    await registrationPage.expectDuplicateUsernameValidation();
  });
});
