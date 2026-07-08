import { expect, test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { readJsonFixture } from '../utils/seed';
import { uploadFiles } from '../utils/uploadFiles';

test.describe('edit profile', () => {
  test.use({ storageState: storageStatePaths.normalUser });

  test('User edits profile with valid inputs', async ({ normalUserAuth, editProfilePage, userProfilePage, page }) => {
    const profileData = readJsonFixture<{ displayName: string; bio: string; website: string }>('e2e/test-data/profile/validProfileUpdateData.json');

    await editProfilePage.goto();
    await editProfilePage.nameInput.fill(profileData.displayName);
    await editProfilePage.bioInput.fill(profileData.bio);
    await editProfilePage.websiteInput.fill(profileData.website);
    await editProfilePage.avatarInput.setInputFiles(uploadFiles.supportedAvatar);
    await page.getByRole('button', { name: /apply/i }).click();
    await editProfilePage.coverInput.setInputFiles(uploadFiles.supportedCover);
    await page.getByRole('button', { name: /apply/i }).click();
    await editProfilePage.saveButton.click();

    await userProfilePage.goto(normalUserAuth.credentials.handle ?? normalUserAuth.credentials.email);
    await expect(page.locator('body')).toContainText(profileData.displayName);
    await expect(page.locator('body')).toContainText(profileData.bio);
  });

  test('Profile edit fails with invalid website URL', async ({ editProfilePage, page }) => {
    const invalidWebsiteData = readJsonFixture<{ website: string }>('e2e/test-data/profile/invalidWebsiteData.json');

    await editProfilePage.goto();
    await editProfilePage.websiteInput.fill(invalidWebsiteData.website);
    await editProfilePage.saveButton.click();

    await expect(page).toHaveURL(/\/settings\/profile/u);
    await expect(editProfilePage.invalidWebsiteMessage()).toBeVisible();
  });
});
