import { test } from '../fixtures/auth';
import { EditProfilePage } from '../pages/EditProfilePage';
import { loadTestData } from '../utils/testData';

type ValidProfileUpdateData = {
  displayName: string;
  bio: string;
  website: string;
};

type InvalidWebsiteData = {
  website: string;
};

const validProfileUpdateData = loadTestData<ValidProfileUpdateData>('validProfileUpdateData.json');
const invalidWebsiteData = loadTestData<InvalidWebsiteData>('invalidWebsiteData.json');

test.describe('edit profile', () => {
  test('User edits profile with valid inputs', async ({ page, normalUserAuth }) => {
    const editProfilePage = new EditProfilePage(page);
    const uniqueDisplayName = `${validProfileUpdateData.displayName} ${Date.now()}`;

    await normalUserAuth();
    await editProfilePage.goto();
    await editProfilePage.updateProfile({
      displayName: uniqueDisplayName,
      bio: validProfileUpdateData.bio,
      website: validProfileUpdateData.website,
    });
    await editProfilePage.uploadAvatarAndCover();
    await editProfilePage.save();

    await editProfilePage.expectSavedProfileVisible(uniqueDisplayName, validProfileUpdateData.website);
  });

  test('Profile edit fails with invalid website URL', async ({ page, normalUserAuth }) => {
    const editProfilePage = new EditProfilePage(page);

    await normalUserAuth();
    await editProfilePage.goto();
    await editProfilePage.updateProfile({
      displayName: 'Invalid URL Validation',
      bio: 'Attempting invalid URL save',
      website: invalidWebsiteData.website,
    });
    await editProfilePage.save();

    await editProfilePage.expectInvalidWebsiteError();
  });
});
