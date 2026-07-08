import { test } from '../fixtures/test';
import { buildRegistrationRuntimeData, uniqueSuffix } from '../utils/dataFactory';
import { getDuplicateUsernameSeed, loadJsonFixture, resolveFixtureTokens } from '../utils/seed';

interface RegistrationFixtureData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  homeCountry: string;
  acceptTerms?: boolean;
}

const validRegistrationTemplate = loadJsonFixture<RegistrationFixtureData>('auth/validUserRegistrationData.json');
const duplicateRegistrationTemplate = loadJsonFixture<RegistrationFixtureData>('auth/duplicateUsernameData.json');

test.describe('e2e/tests/registration.spec.ts', () => {
  test('Successful user registration with valid inputs', async ({ guestUser, makePages }) => {
    const { registrationPage } = makePages(guestUser.page);
    const runtimeIdentity = buildRegistrationRuntimeData();
    const data = resolveFixtureTokens(validRegistrationTemplate, {
      UNIQUE_SUFFIX: uniqueSuffix('registration'),
      UNIQUE_FULL_NAME: runtimeIdentity.fullName,
      UNIQUE_USERNAME: runtimeIdentity.username,
      UNIQUE_EMAIL: runtimeIdentity.email,
    });

    await registrationPage.goto();
    await registrationPage.register(data);
    await registrationPage.expectSuccessfulRegistration();
  });

  test('Registration fails with duplicate username', async ({ guestUser, makePages }) => {
    const { registrationPage } = makePages(guestUser.page);
    const data = resolveFixtureTokens(duplicateRegistrationTemplate, {
      UNIQUE_SUFFIX: uniqueSuffix('duplicate'),
      DUPLICATE_USERNAME: getDuplicateUsernameSeed(),
    });

    await registrationPage.goto();
    await registrationPage.register(data);
    await registrationPage.expectDuplicateUsernameError();
    await registrationPage.expectOnRegistrationPage();
  });
});
