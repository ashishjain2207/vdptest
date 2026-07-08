import { test, loginAs } from '../fixtures/test.fixture';

test.describe('Onboarding', () => {
  test('Onboarding Flow Completion with Optional Steps Skipped', async ({
    page,
    normalUserAuth,
    onboardingPage,
  }) => {
    const country = process.env.E2E_ONBOARDING_COUNTRY ?? process.env.E2E_DEFAULT_COUNTRY ?? 'Germany';

    await loginAs(page, normalUserAuth);
    await onboardingPage.gotoOnboarding('/posts');
    await onboardingPage.skipOptionalStepsIfPresent();

    const countryInput = page.getByLabel(/home country/i).first();
    if (await countryInput.isVisible().catch(() => false)) {
      await onboardingPage.completeHomeCountry(country);
    }

    await onboardingPage.expectCompleted();
  });
});
