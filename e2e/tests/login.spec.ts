import { expect, test } from '../fixtures/test';
import validLoginData from '../test-data/auth/validLoginData.json';
import invalidPasswordData from '../test-data/auth/invalidPasswordData.json';

test.describe('login', () => {
  test('Login succeeds with valid credentials', async ({ loginPage, normalUserAuth }) => {
    await loginPage.login(normalUserAuth.credentials);

    await loginPage.expectLoginSucceeded();
    await expect(normalUserAuth.page).toHaveURL(new RegExp(validLoginData.expectedRedirect));
  });

  test('Login fails with invalid password', async ({ loginPage, normalUserAuth }) => {
    await loginPage.goto();
    await loginPage.enterIdentifier(normalUserAuth.credentials.identifier);
    await loginPage.enterPassword(invalidPasswordData.invalidPassword);
    await loginPage.submit();

    await loginPage.expectInvalidCredentialsError();
    await loginPage.expectOnLoginPage();
  });
});
