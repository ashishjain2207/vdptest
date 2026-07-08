import { expect, test } from '../fixtures/test';
import { loadJsonFixture, resolveFixtureTokens } from '../utils/seed';
import { uniqueSuffix } from '../utils/dataFactory';
import { uploadFiles } from '../utils/uploadFiles';

interface ProfileFixtureData {
  displayName: string;
  bio: string;
  website: string;
}

const validProfileTemplate = loadJsonFixture<ProfileFixtureData>('profile/validProfileUpdateData.json');
const invalidWebsiteTemplate = loadJsonFixture<{ website: string }>('profile/invalidWebsiteData.json');

test.describe('e2e/tests/editProfile.spec.ts', () => {
  test('User edits profile with valid inputs', async ({ normalUserAuth, makePages, appConfig }) => {
    const { editProfilePage, userProfilePage } = makePages(normalUserAuth.page);
    const unique = uniqueSuffix('profile');
    const data = resolveFixtureTokens(validProfileTemplate, {
      UNIQUE_SUFFIX: unique,
      UNIQUE_DISPLAY_NAME: `IMRIVA Updated ${unique}`,
      UNIQUE_BIO: `Playwright updated biography ${unique}`,
      UNIQUE_WEBSITE: `https://example.com/${unique}`,
    });

    await editProfilePage.goto();
    await editProfilePage.updateProfile(data);
    await editProfilePage.uploadProfilePhoto(uploadFiles.validProfileAvatar);
    await editProfilePage.uploadCoverPhoto(uploadFiles.validProfileCover);
    await editProfilePage.save();
    await editProfilePage.expectSaved();

    if (appConfig.normalUser.profileKey) {
      await userProfilePage.goto(appConfig.normalUser.profileKey);
      await expect(normalUserAuth.page.getByText(data.displayName, { exact: false })).toBeVisible();
      await expect(normalUserAuth.page.getByText(data.bio, { exact: false })).toBeVisible();
      await expect(normalUserAuth.page.getByText(/example\.com/i)).toBeVisible();
    }
  });

  test('Profile edit fails with invalid website URL', async ({ normalUserAuth, makePages }) => {
    const { editProfilePage } = makePages(normalUserAuth.page);

    await editProfilePage.goto();
    await editProfilePage.websiteField().fill(invalidWebsiteTemplate.website);
    await editProfilePage.save();
    await editProfilePage.expectWebsiteFieldInvalid();
    await editProfilePage.expectStillOnEditProfilePage();
  });
});
