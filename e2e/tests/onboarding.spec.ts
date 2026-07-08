import { expect, test } from '../fixtures/test';
import { uploadFiles } from '../utils/uploadFiles';
import invalidProfilePicFormat from '../test-data/onboarding/invalidProfilePicFormat.json';

test.describe('onboarding', () => {
  test('Onboarding flow completes successfully with optional steps skipped', async ({
    normalUserAuth,
    onboardingPage,
    homeFeedPage,
  }) => {
    await normalUserAuth.signIn();
    await onboardingPage.goto();
    await onboardingPage.completeWithOptionalStepsSkipped();

    await onboardingPage.expectCompletedToHomeFeed();
    await homeFeedPage.expectLoaded();
  });

  test('Uploading invalid profile picture format during onboarding shows error', async ({
    normalUserAuth,
    onboardingPage,
  }) => {
    await normalUserAuth.signIn();
    await onboardingPage.goto();
    await onboardingPage.uploadInvalidProfilePicture(uploadFiles.invalidProfilePicture);

    await onboardingPage.expectUnsupportedProfilePictureError();
    await expect(onboardingPage.uploadError).toContainText(new RegExp(invalidProfilePicFormat.expectedError, 'i'));
  });
});
