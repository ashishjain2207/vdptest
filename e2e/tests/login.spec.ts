import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';

const validLoginData = readTestData<{ expectedRedirect: string }>('test-data/auth/validLoginData.json');
const invalidPasswordData = readTestData<{ password: string; expectedErrorPattern: string }>('test-data/auth/invalidPasswordData.json');

test.describe('login', () => {
  test('login succeeds with valid credentials', async ({ loginPage, normalUserAuth }) => {
    await loginPage.goto();
    await loginPage.login(normalUserAuth.credentials.email || normalUserAuth.credentials.username || '', normalUserAuth.credentials.password);
    await loginPage.expectSuccessfulLogin();
  });

  test('login fails with invalid password', async ({ loginPage, normalUserAuth }) => {
    await loginPage.goto();
    await loginPage.login(normalUserAuth.credentials.email || normalUserAuth.credentials.username || '', invalidPasswordData.password);
    await loginPage.expectInvalidCredentialsError();
  });
});
