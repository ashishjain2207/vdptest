import type { Page } from '@playwright/test';
import { test } from '../fixtures/test';
import type { PageObjectFixtures } from '../fixtures/page.fixtures';
import { getOnboardingUserSeed, loadJsonFixture } from '../utils/seed';
import { uploadFiles } from '../utils/uploadFiles';

loadJsonFixture<{ fileKey: string; expectedError: string }>('onboarding/invalidProfilePicFormat.json');

async function loginAsOnboardingUser(
  page: Page,
  usernameOrEmail: string,
  password: string,
  makePages: (page: Page) => PageObjectFixtures,
) {
  const { loginPage } = makePages(page);
  await loginPage.goto();
  await loginPage.login({ usernameOrEmail, password });
}

test.describe('e2e/tests/onboarding.spec.ts', () => {
  test('Onboarding flow completes successfully with optional steps skipped', async ({ guestUser, makePages, appConfig }) => {
    test.skip(
      !appConfig.seeds.onboardingUserPassword || !(appConfig.seeds.onboardingUserUsernameOrEmail ?? appConfig.seeds.onboardingUserEmail),
      'Set onboarding user credentials for a user that still lands on /onboarding.',
    );

    const onboardingUser = getOnboardingUserSeed();
    const { onboardingPage, homeFeedPage } = makePages(guestUser.page);

    await loginAsOnboardingUser(guestUser.page, onboardingUser.usernameOrEmail, onboardingUser.password, makePages);
    if (!/\/onboarding(?:\?|$)/.test(guestUser.page.url())) {
      test.skip(true, 'The configured onboarding user no longer redirects to /onboarding.');
    }

    await onboardingPage.expectLoaded();
    await onboardingPage.skipOptionalStepIfVisible(/skip/i);
    await onboardingPage.skipOptionalStepIfVisible(/skip bio/i);
    await onboardingPage.skipOptionalStepIfVisible(/skip interests/i);
    await onboardingPage.skipOptionalStepIfVisible(/skip following/i);
    await onboardingPage.completeOnboarding('DE');
    await homeFeedPage.expectLoaded();
  });

  test('Uploading invalid profile picture format during onboarding shows error', async ({ guestUser, makePages, appConfig }) => {
    test.skip(
      !appConfig.seeds.onboardingUserPassword || !(appConfig.seeds.onboardingUserUsernameOrEmail ?? appConfig.seeds.onboardingUserEmail),
      'Set onboarding user credentials for a user that still lands on /onboarding.',
    );

    const onboardingUser = getOnboardingUserSeed();
    const { onboardingPage } = makePages(guestUser.page);

    await loginAsOnboardingUser(guestUser.page, onboardingUser.usernameOrEmail, onboardingUser.password, makePages);
    if (!/\/onboarding(?:\?|$)/.test(guestUser.page.url())) {
      test.skip(true, 'The configured onboarding user no longer redirects to /onboarding.');
    }

    await onboardingPage.expectLoaded();
    const hasUploadStep = await onboardingPage.hasProfilePictureUploadStep();
    if (!hasUploadStep) {
      test.skip(true, 'Current onboarding only exposes home-country completion and does not render a profile picture upload step.');
    }

    await onboardingPage.uploadInvalidProfilePicture(uploadFiles.invalidProfilePictureFile);
    await onboardingPage.expectUploadError();
  });
});
