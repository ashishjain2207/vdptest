import { test, expect } from '../fixtures/test';
import { getRoleMissingReason } from '../utils/env';
import { getInvalidLoginData } from '../utils/dataFactory';

test.describe('login', () => {
  test('Login succeeds with valid credentials', async ({ env, loginPage, homeFeedPage, onboardingPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.login(env.user.username, env.user.password);

    await expect(loginPage.page).not.toHaveURL(/\/login$/);
    await expect(loginPage.page).toHaveURL(/\/(posts|onboarding)(\?|$)/);

    if (/\/onboarding(\?|$)/.test(loginPage.page.url())) {
      await onboardingPage.expectLoaded();
    } else {
      await homeFeedPage.expectLoaded();
    }

    await expect(loginPage.error).toHaveCount(0);
  });

  test('Login fails with invalid password', async ({ env, loginPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const invalidPassword = getInvalidLoginData();

    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.login(env.user.username, invalidPassword.password);

    await expect(loginPage.error).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });
});
