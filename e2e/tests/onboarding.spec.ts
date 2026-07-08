import { test } from '../fixtures/test.fixture';

test.describe('Onboarding', () => {
  test('Onboarding Flow Completion with Optional Steps Skipped', async ({
    normalUserAuth,
    onboardingPage,
    homeFeedPage,
  }) => {
    await normalUserAuth.login();
    await onboardingPage.goTo();
    await onboardingPage.completeWithOptionalStepsSkipped();
    await onboardingPage.expectCompleted();
    await homeFeedPage.expectLoaded();
  });
});
