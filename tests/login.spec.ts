import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';

type InvalidLoginData = {
  email: string;
  password: string;
};

test.describe('login', () => {
  test('Login with Valid Credentials', async ({ loginPage, homeFeedPage, normalUserAuth }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    await loginPage.expectSuccessfulLoginRedirect();
    await homeFeedPage.expectLoaded();
  });

  test('Login with Invalid Credentials', async ({ loginPage }) => {
    const invalidLogin = loadTestData<InvalidLoginData>('invalidLogin.json');

    await loginPage.login(invalidLogin.email, invalidLogin.password);
    await loginPage.expectInvalidLoginError();
  });
});
