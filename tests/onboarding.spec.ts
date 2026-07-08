import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';

test.describe('onboarding', () => {
  test('Onboarding Flow Completion with Optional Steps Skipped', async ({ page, loginPage, onboardingPage, homeFeedPage, normalUserAuth }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/onboarding');
    await page.goto('/onboarding');

    if (/\/posts/i.test(page.url())) {
      await homeFeedPage.expectLoaded();
      return;
    }

    await onboardingPage.gotoOnboarding();
    await onboardingPage.complete(process.env.E2E_ONBOARDING_COUNTRY ?? 'United States');

    await onboardingPage.expectCompleted();
  });
});
