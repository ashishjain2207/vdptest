import { expect, test } from '../fixtures/test';
import { env } from '../utils/env';
import { loadJsonFixture, resolveFixtureTokens } from '../utils/seed';

interface LoginFixtureData {
  usernameOrEmail: string;
  password: string;
}

const validLoginTemplate = loadJsonFixture<LoginFixtureData>('auth/validLoginData.json');
const invalidPasswordTemplate = loadJsonFixture<LoginFixtureData>('auth/invalidPasswordData.json');

test.describe('e2e/tests/login.spec.ts', () => {
  test('Login succeeds with valid credentials', async ({ guestUser, makePages }) => {
    const { loginPage, homeFeedPage } = makePages(guestUser.page);
    const data = resolveFixtureTokens(validLoginTemplate, {
      E2E_NORMAL_USER_USERNAME_OR_EMAIL: env.normalUser.usernameOrEmail,
      E2E_NORMAL_USER_PASSWORD: env.normalUser.password,
    });

    await loginPage.goto();
    await loginPage.login(data);
    await loginPage.expectLoggedIn();

    if (/\/posts(?:\?|$)/.test(guestUser.page.url())) {
      await homeFeedPage.expectLoaded();
    } else {
      await expect(guestUser.page).toHaveURL(/\/onboarding(?:\?|$)/);
    }
  });

  test('Login fails with invalid password', async ({ guestUser, makePages }) => {
    const { loginPage } = makePages(guestUser.page);
    const data = resolveFixtureTokens(invalidPasswordTemplate, {
      E2E_NORMAL_USER_USERNAME_OR_EMAIL: env.normalUser.usernameOrEmail,
    });

    await loginPage.goto();
    await loginPage.login(data);
    await loginPage.expectInvalidCredentialsError();
    await loginPage.expectOnLoginPage();
  });
});
