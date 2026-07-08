import { test, expect } from '../fixtures/test';
import { getRoleMissingReason } from '../utils/env';

test.describe('onboarding', () => {
  test('Onboarding flow completes successfully with optional steps skipped', async ({ env, loginPage, onboardingPage }) => {
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
    'Uploading invalid profile picture format during onboarding shows error',
    'The current onboarding flow only asks for home country and does not expose profile-picture upload controls.',
  );
});
