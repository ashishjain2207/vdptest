import { test } from '../fixtures/test';
import { readTestData, uniqueSuffix } from '../utils/dataFactory';
import { uploadFiles } from '../utils/uploadFiles';

const validProfileUpdateData = readTestData<{
  displayNameTemplate: string;
  bioTemplate: string;
  website: string;
  profilePicturePathKey: keyof typeof uploadFiles;
  coverPhotoPathKey: keyof typeof uploadFiles;
}>('test-data/profile/validProfileUpdateData.json');
const invalidWebsiteData = readTestData<{
  website: string;
  expectedErrorPattern: string;
}>('test-data/profile/invalidWebsiteData.json');

test.describe('edit profile', () => {
  test('user edits profile with valid inputs', async ({ normalUserAuth, editProfilePage, userProfilePage }) => {
    const suffix = uniqueSuffix('profile');
    const displayName = `${validProfileUpdateData.displayNameTemplate} ${suffix}`;
    const bio = `${validProfileUpdateData.bioTemplate} ${suffix}`;

    await normalUserAuth.signIn();
    await editProfilePage.goto();
    await editProfilePage.updateProfile({
      displayName,
      bio,
      website: validProfileUpdateData.website,
      profilePicturePath: uploadFiles[validProfileUpdateData.profilePicturePathKey],
      coverPhotoPath: uploadFiles[validProfileUpdateData.coverPhotoPathKey],
    });
    await editProfilePage.expectSaveSuccess();

    const profileKey = normalUserAuth.credentials.profileSlug ?? normalUserAuth.credentials.userId ?? normalUserAuth.credentials.username;
    if (profileKey) {
      await userProfilePage.gotoOwnProfile(profileKey);
      await userProfilePage.expectProfileContains(displayName);
      await userProfilePage.expectProfileContains(bio);
    }
  });

  test('profile edit fails with invalid website URL', async ({ normalUserAuth, editProfilePage }) => {
    await normalUserAuth.signIn();
    await editProfilePage.goto();
    await editProfilePage.updateProfile({ website: invalidWebsiteData.website });
    await editProfilePage.expectInvalidWebsiteUrl();
  });
});
