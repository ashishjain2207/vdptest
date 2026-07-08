import { test, expect } from '../fixtures/test';
import { getRoleMissingReason } from '../utils/env';

test.describe('onboarding', () => {
  test('completes the home-country onboarding step for a dedicated onboarding account', async ({ env, loginPage, onboardingPage }) => {
    test.skip(!env.onboarding.isConfigured, getRoleMissingReason(env, 'onboarding'));

    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.login(env.onboarding.username, env.onboarding.password);

    await onboardingPage.expectLoaded();
    await onboardingPage.selectHomeCountry(env.homeCountry);
    await onboardingPage.continue();

    await expect(onboardingPage.page).toHaveURL(/\/posts$/);
  });

  test.fixme(
    'legacy multi-step onboarding fields are not present in the current app',
    'The current onboarding flow only asks for home country, so DOB/confirm-password/terms style steps cannot be automated here.',
  );
});
