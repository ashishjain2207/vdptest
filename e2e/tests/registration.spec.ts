import { test } from '../fixtures/test';
import { buildUniqueRegistrationData, readTestData, type RegistrationInput } from '../utils/dataFactory';
import { seededDuplicateUsername } from '../utils/seed';

const validUserRegistrationData = readTestData<RegistrationInput>('test-data/auth/validUserRegistrationData.json');
const duplicateUsernameData = readTestData<RegistrationInput & { duplicateUsernameEnv: string; expectedErrorPattern: string }>('test-data/auth/duplicateUsernameData.json');

test.describe('registration', () => {
  test('successful user registration with valid inputs', async ({ registrationPage, normalUserAuth }) => {
    const registration = buildUniqueRegistrationData(validUserRegistrationData);

    await registrationPage.goto();
    await registrationPage.fillRegistrationForm(registration);
    await registrationPage.submit();
    await registrationPage.expectRegistrationSuccess();
  });

  test('registration fails with duplicate username', async ({ registrationPage, normalUserAuth }) => {
    const registration = buildUniqueRegistrationData({
      ...duplicateUsernameData,
      username: seededDuplicateUsername(duplicateUsernameData.username),
    });

    await registrationPage.goto();
    await registrationPage.fillRegistrationForm(registration);
    await registrationPage.submit();
    await registrationPage.expectDuplicateUsernameError();
  });
});
