import { expect, test } from '../fixtures/test';
import { readJsonFixture } from '../utils/seed';

test.describe('login', () => {
  test.use({ storageState: undefined });

  test('Login succeeds with valid credentials', async ({ normalUserAuth, loginPage, page }) => {
    const validLoginData = readJsonFixture<{ expectedRedirectPath: string }>('e2e/test-data/auth/validLoginData.json');

    await loginPage.goto();
    await loginPage.login(normalUserAuth.credentials.email, normalUserAuth.credentials.password);

    await expect(page).toHaveURL(new RegExp(`${validLoginData.expectedRedirectPath}|/onboarding`, 'u'));
  });

  test('Login fails with invalid password', async ({ normalUserAuth, loginPage, page }) => {
    const invalidLoginData = readJsonFixture<{ password: string }>('e2e/test-data/auth/invalidPasswordData.json');

    await loginPage.goto();
    await loginPage.login(normalUserAuth.credentials.email, invalidLoginData.password);

    await loginPage.expectLoginPage();
    await expect(loginPage.errorAlert).toBeVisible();
  });
});
