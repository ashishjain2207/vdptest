import { test, expect } from '../fixtures/test';
import { buildProfileUpdateData, getInvalidWebsiteData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { getOwnProfile, updateOwnProfileViaApi, type ProfileUpdatePayload, extractId } from '../utils/seed';
import { UPLOAD_FIXTURES } from '../utils/uploadFiles';

function profileSnapshotToUpdateBody(profile: Record<string, unknown>): ProfileUpdatePayload {
  return {
    handle: typeof profile.handle === 'string' ? profile.handle : undefined,
    bio: typeof profile.bio === 'string' ? profile.bio : null,
    company: typeof profile.company === 'string' ? profile.company : null,
    location: typeof profile.location === 'string' ? profile.location : null,
    displayName:
      typeof profile.displayName === 'string'
        ? profile.displayName
        : typeof profile.name === 'string'
          ? profile.name
          : null,
    contactEmail: typeof profile.contactEmail === 'string' ? profile.contactEmail : null,
    linkedInProfileUrl: typeof profile.linkedInProfileUrl === 'string' ? profile.linkedInProfileUrl : null,
    description: typeof profile.description === 'string' ? profile.description : null,
    website: typeof profile.website === 'string' ? profile.website : null,
    avatarUrl: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : null,
    coverImageUrl: typeof profile.coverImageUrl === 'string' ? profile.coverImageUrl : null,
  };
}

test.describe('edit profile', () => {
  test('User edits profile with valid inputs', async ({ auth, env, request, editProfilePage, userProfilePage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const originalProfile = await getOwnProfile(request, 'user');
    const rollbackBody = profileSnapshotToUpdateBody(originalProfile);
    const update = buildProfileUpdateData();
    const ownProfileKey = extractId(originalProfile, 'profileSlug', 'handle', 'userId', 'UserId');

    try {
      await auth.loginAsPrimaryUser('/settings/profile');
      await editProfilePage.expectLoaded();
      await editProfilePage.fillForm({
        name: update.displayName,
        bio: update.bio,
        description: update.description,
        website: update.website,
      });
      await editProfilePage.uploadAvatar(UPLOAD_FIXTURES.avatarValid);
      await editProfilePage.applyCropperIfVisible();
      await editProfilePage.uploadCover(UPLOAD_FIXTURES.coverValid);
      await editProfilePage.applyCropperIfVisible();
      await editProfilePage.save();

      await expect(editProfilePage.page.locator('#name')).toHaveValue(update.displayName);
      await expect(editProfilePage.page.locator('#bio')).toHaveValue(update.bio);
      await expect(editProfilePage.page.locator('#description')).toHaveValue(update.description);
      await expect(editProfilePage.page.locator('#website')).toHaveValue(update.website);

      await userProfilePage.goto(ownProfileKey);
      await userProfilePage.expectLoaded();
      await expect(userProfilePage.page).toContainText(update.displayName);
      await expect(userProfilePage.page).toContainText(update.bio);
    } finally {
      await updateOwnProfileViaApi(request, 'user', rollbackBody);
    }
  });

  test('Profile edit fails with invalid website URL', async ({ auth, env, editProfilePage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const invalidWebsite = getInvalidWebsiteData();

    await auth.loginAsPrimaryUser('/settings/profile');
    await editProfilePage.expectLoaded();
    await editProfilePage.fillForm({ website: invalidWebsite.website });
    await editProfilePage.save();

    const validationMessage = await editProfilePage.page
      .locator('#website')
      .evaluate((element) => (element as HTMLInputElement).validationMessage);
    expect(validationMessage).not.toBe('');
    await expect(editProfilePage.page.locator('#website')).toHaveValue(invalidWebsite.website);
    await expect(editProfilePage.page).toHaveURL(/\/settings\/profile$/);
  });
});
