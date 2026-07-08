import { expect, test } from '../fixtures/test';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { createRuntimeTemplateTokens, interpolateFixtureData } from '../utils/dataFactory';
import type { RoleCredentials } from '../utils/env';
import { createAdHocStorageState, readJsonFixture, registerUser } from '../utils/seed';

test.describe('onboarding', () => {
  test.use({ storageState: undefined });

  test('Onboarding flow completes successfully with optional steps skipped', async ({ browser }, testInfo) => {
    const registrationData = interpolateFixtureData(
      readJsonFixture<{
        fullName: string;
        username: string;
        email: string;
        password: string;
        homeCountry: string;
      }>('e2e/test-data/auth/validUserRegistrationData.json'),
      createRuntimeTemplateTokens('onboarding'),
    );

    const registrationResult = await registerUser({
      email: registrationData.email,
      password: registrationData.password,
      displayName: registrationData.fullName,
      handle: registrationData.username,
    });
    expect([200, 201]).toContain(registrationResult.status);

    const runtimeCredentials: RoleCredentials = {
      role: 'secondaryUser',
      email: registrationData.email,
      password: registrationData.password,
      handle: registrationData.username,
      displayName: registrationData.fullName,
    };
    const storageStatePath = testInfo.outputPath('new-onboarding-user.json');

    await createAdHocStorageState(browser, runtimeCredentials, storageStatePath);

    const context = await browser.newContext({ storageState: storageStatePath });
    const page = await context.newPage();
    const onboardingPage = new OnboardingPage(page);
    const homeFeedPage = new HomeFeedPage(page);

    try {
      await onboardingPage.goto();
      await onboardingPage.skipProfilePictureStepIfPresent();
      await onboardingPage.skipBioStepIfPresent();
      await onboardingPage.skipInterestsStepIfPresent();
      await onboardingPage.skipSuggestedUsersStepIfPresent();
      await onboardingPage.completeHomeCountryStep(registrationData.homeCountry);
      await homeFeedPage.expectLoaded();
    } finally {
      await context.close();
    }
  });

  test('Uploading invalid profile picture format during onboarding shows error', async () => {
    void readJsonFixture('e2e/test-data/onboarding/invalidProfilePicFormat.json');
    test.fixme(
      true,
      'Current onboarding only supports home-country selection; no profile-picture upload step exists in the product UI yet.',
    );
  });
});
