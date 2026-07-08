import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';
import { uploadFiles } from '../utils/uploadFiles';

const invalidProfilePicFormat = readTestData<{
  filePathKey: keyof typeof uploadFiles;
  expectedErrorPattern: string;
}>('test-data/onboarding/invalidProfilePicFormat.json');

test.describe('onboarding', () => {
  test('onboarding flow completes successfully with optional steps skipped', async ({ normalUserAuth, onboardingPage }) => {
    await normalUserAuth.signIn();
    await onboardingPage.goto();
    await onboardingPage.skipOptionalSteps();
    await onboardingPage.complete();
    await onboardingPage.expectCompleted();
  });

  test('uploading invalid profile picture format during onboarding shows error', async ({ normalUserAuth, onboardingPage }) => {
    await normalUserAuth.signIn();
    await onboardingPage.goto();
    await onboardingPage.uploadInvalidProfilePicture(uploadFiles[invalidProfilePicFormat.filePathKey]);
    await onboardingPage.expectInvalidProfilePictureError(invalidProfilePicFormat.expectedErrorPattern);
  });
});
