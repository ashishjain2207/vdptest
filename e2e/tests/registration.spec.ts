import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueEmail, uniqueUsername } from '../utils/randomData';
import type { RegistrationInput } from '../pages/RegistrationPage';

type ValidRegistrationData = {
  fullName: string;
  usernamePrefix: string;
  emailPrefix: string;
  emailDomain: string;
  password: string;
  dateOfBirth: string;
  homeCountry: string;
  acceptTerms: boolean;
};

type DuplicateUsernameData = {
  fullName: string;
  username: string;
  emailPrefix: string;
  emailDomain: string;
  password: string;
  dateOfBirth: string;
  homeCountry: string;
  acceptTerms: boolean;
};

test.describe('User registration', () => {
  test('User Registration with Valid Data', async ({ registrationPage, normalUserAuth }) => {
    const data = loadTestData<ValidRegistrationData>('test-data/validUserRegistration.json');
    const input: RegistrationInput = {
      fullName: data.fullName,
      username: uniqueUsername(data.usernamePrefix),
      email: uniqueEmail(data.emailPrefix, data.emailDomain),
      password: data.password,
      confirmPassword: data.password,
      dateOfBirth: data.dateOfBirth,
      homeCountry: data.homeCountry,
      acceptTerms: data.acceptTerms,
    };

    void normalUserAuth;
    await registrationPage.goTo();
    await registrationPage.completeRegistration(input);
    await registrationPage.expectSuccessfulRegistration();
  });

  test('User Registration with Missing Required Fields', async ({ registrationPage }) => {
    await registrationPage.goTo();
    await registrationPage.submit();
    await registrationPage.expectRequiredFieldValidation();
  });

  test('User Registration with Duplicate Username', async ({ registrationPage, existingUserSetup }) => {
    const data = loadTestData<DuplicateUsernameData>('test-data/duplicateUsername.json');
    await registrationPage.goTo();
    await registrationPage.completeRegistration({
      fullName: data.fullName,
      username: existingUserSetup.username,
      email: uniqueEmail(data.emailPrefix, data.emailDomain),
      password: data.password,
      confirmPassword: data.password,
      dateOfBirth: data.dateOfBirth,
      homeCountry: data.homeCountry,
      acceptTerms: data.acceptTerms,
    });
    await registrationPage.expectDuplicateUsernameError();
  });
});
