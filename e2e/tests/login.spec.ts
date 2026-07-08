import { test, expect } from '../fixtures/test';
import { getRoleMissingReason } from '../utils/env';

test.describe('login', () => {
  test('shows an error for invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.login('invalid-user@example.test', 'not-the-right-password');

    await expect(loginPage.error).toBeVisible();
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });

  test('logs in with the configured primary account', async ({ env, loginPage, homeFeedPage, onboardingPage }) => {
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
  });
});
