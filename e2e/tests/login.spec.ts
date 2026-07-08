import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

test.describe('Login', () => {
  test('Login with Valid Credentials', async ({ loginPage, homeFeedPage, normalUserAuth }) => {
    await loginPage.gotoLogin();
    await loginPage.loginSuccessfully(normalUserAuth);
    await homeFeedPage.expectLoaded();
  });

  test('Login with Invalid Credentials', async ({ loginPage }) => {
    const invalidLogin = loadTestData<{ email: string; password: string }>('invalidLogin.json');

    await loginPage.gotoLogin();
    await loginPage.login(invalidLogin);
    await loginPage.expectInvalidLogin();
  });
});
