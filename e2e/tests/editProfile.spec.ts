import { test } from '../fixtures/test';
import { uniqueValue } from '../utils/dataFactory';
import { uploadFiles } from '../utils/uploadFiles';
import validProfileUpdateData from '../test-data/profile/validProfileUpdateData.json';
import invalidWebsiteData from '../test-data/profile/invalidWebsiteData.json';

test.describe('edit profile', () => {
  test('User edits profile with valid inputs', async ({
    normalUserAuth,
    editProfilePage,
    userProfilePage,
  }) => {
    const displayName = uniqueValue(validProfileUpdateData.displayNamePrefix);
    const bio = uniqueValue(validProfileUpdateData.bioPrefix);

    await normalUserAuth.signIn();
    await editProfilePage.goto();
    await editProfilePage.updateProfile({
      displayName,
      bio,
      website: validProfileUpdateData.website,
      profilePicturePath: uploadFiles.validProfilePicture,
      coverPhotoPath: uploadFiles.validCoverPhoto,
    });

    await editProfilePage.expectProfileSaved();
    await userProfilePage.gotoOwnProfile();
    await userProfilePage.expectProfileContains(displayName);
    await userProfilePage.expectProfileContains(bio);
  });

  test('Profile edit fails with invalid website URL', async ({ normalUserAuth, editProfilePage }) => {
    await normalUserAuth.signIn();
    await editProfilePage.goto();
    await editProfilePage.updateProfile({
      website: invalidWebsiteData.website,
    });

    await editProfilePage.expectInvalidWebsiteError();
    await editProfilePage.expectOnEditProfilePage();
  });
});
