import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

type InvalidLoginData = {
  email: string;
  password: string;
};

test.describe('login', () => {
  test('Login with Valid Credentials', async ({ normalUserAuth, loginPage }) => {
    await loginPage.expectAuthenticatedRedirect();
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });
  });

  test('Login with Invalid Credentials', async ({ loginPage }) => {
    const invalidLogin = loadTestData<InvalidLoginData>('invalidLogin.json');

    await loginPage.login(invalidLogin.email, invalidLogin.password);
    await loginPage.expectInvalidLoginError();
  });
});
