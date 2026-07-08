import { test } from '../fixtures/test.fixture';

test.describe('onboarding', () => {
  test('Onboarding Flow Completion with Optional Steps Skipped', async ({ normalUserAuth, onboardingPage, homeFeedPage }) => {
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });

    await onboardingPage.open();
    await onboardingPage.skipOptionalSteps();
    await onboardingPage.complete();
    await homeFeedPage.expectLoaded();
  });
});
