import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

type InvalidLoginData = {
  identifier: string;
  password: string;
};

test.describe('Login', () => {
  test('Login with Valid Credentials', async ({ loginPage, homeFeedPage, normalUserAuth }) => {
    await loginPage.goTo();
    await loginPage.enterIdentifier(normalUserAuth.credentials.identifier);
    await loginPage.enterPassword(normalUserAuth.credentials.password);
    await loginPage.submit();
    await homeFeedPage.expectLoaded();
  });

  test('Login with Invalid Credentials', async ({ loginPage }) => {
    const invalidLogin = loadTestData<InvalidLoginData>('test-data/invalidLogin.json');
    await loginPage.goTo();
    await loginPage.enterIdentifier(invalidLogin.identifier);
    await loginPage.enterPassword(invalidLogin.password);
    await loginPage.submit();
    await loginPage.expectInvalidCredentials();
  });
});
