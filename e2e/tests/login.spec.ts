import { expect, test } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';
import { loadTestData } from '../utils/testData';

type ValidLoginData = {
  emailOrUsername: string;
  password: string;
};

type InvalidPasswordData = {
  emailOrUsername: string;
  invalidPassword: string;
};

const validLoginData = loadTestData<ValidLoginData>('validLoginData.json');
const invalidPasswordData = loadTestData<InvalidPasswordData>('invalidPasswordData.json');

test.describe('login', () => {
  test('Login succeeds with valid credentials', async ({ page, normalUserAuth }) => {
    const loginPage = new LoginPage(page);
    const email = process.env.E2E_USER_EMAIL ?? validLoginData.emailOrUsername;
    const password = process.env.E2E_USER_PASSWORD ?? validLoginData.password;

    if (process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
      await normalUserAuth();
    } else {
      await loginPage.goto();
      await loginPage.login(email, password);
    }

    await expect(page).toHaveURL(/\/(posts|onboarding|profile\/.+|admin)/);
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });

  test('Login fails with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = process.env.E2E_USER_EMAIL ?? invalidPasswordData.emailOrUsername;

    await loginPage.goto();
    await loginPage.login(email, 'not-the-password');

    await loginPage.expectOnLoginPage();
    await loginPage.expectInvalidCredentialsError();
  });
});
