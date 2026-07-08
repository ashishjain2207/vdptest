import { expect, test } from '../fixtures/test';
import { createRuntimeTemplateTokens, interpolateFixtureData } from '../utils/dataFactory';
import { readJsonFixture } from '../utils/seed';

test.describe('registration', () => {
  test('Successful user registration with valid inputs', async ({ normalUserAuth, registrationPage, page }) => {
    void normalUserAuth;
    const tokens = createRuntimeTemplateTokens('registration');
    const registrationData = interpolateFixtureData(
      readJsonFixture<Record<string, string>>('e2e/test-data/auth/validUserRegistrationData.json'),
      tokens,
    );

    await registrationPage.goto();
    await registrationPage.fillRegistrationForm({
      fullName: registrationData.fullName,
      username: registrationData.username,
      homeCountry: registrationData.homeCountry,
      email: registrationData.email,
      password: registrationData.password,
    });
    await registrationPage.submit();

    // The current product redirects to the login screen after successful signup.
    await expect(page).toHaveURL(/\/login/u);
  });

  test('Registration fails with duplicate username', async ({ normalUserAuth, registrationPage, page }) => {
    void normalUserAuth;
    const tokens = createRuntimeTemplateTokens('duplicate-user');
    const duplicateData = interpolateFixtureData(
      readJsonFixture<Record<string, string>>('e2e/test-data/auth/duplicateUsernameData.json'),
      tokens,
    );

    await registrationPage.goto();
    await registrationPage.fillRegistrationForm({
      fullName: duplicateData.fullName,
      username: duplicateData.username,
      homeCountry: duplicateData.homeCountry,
      email: duplicateData.email,
      password: duplicateData.password,
    });
    await registrationPage.submit();

    await expect(page).toHaveURL(/\/signup/u);
    await expect(registrationPage.usernameTakenMessage()).toBeVisible();
  });
});
