import { expect, test } from '../fixtures/auth';
import { OnboardingPage } from '../pages/OnboardingPage';
import { loadTestData } from '../utils/testData';

type InvalidProfilePicFormat = {
  fileName: string;
};

const invalidProfilePicFormat = loadTestData<InvalidProfilePicFormat>('invalidProfilePicFormat.json');

test.describe('onboarding', () => {
  test('Onboarding flow completes successfully with optional steps skipped', async ({ page, normalUserAuth }) => {
    const onboardingPage = new OnboardingPage(page);

    await normalUserAuth();
    await onboardingPage.goto();
    await onboardingPage.skipOptionalSteps();
    await onboardingPage.completeOnboarding();

    await expect(page).toHaveURL(/\/posts(?:\?.*)?$/);
  });

  test('Uploading invalid profile picture format during onboarding shows error', async ({ page, normalUserAuth }) => {
    const onboardingPage = new OnboardingPage(page);
    void invalidProfilePicFormat;

    await normalUserAuth();
    await onboardingPage.goto();
    await onboardingPage.uploadInvalidProfilePicture();

    await onboardingPage.expectUploadError();
  });
});
