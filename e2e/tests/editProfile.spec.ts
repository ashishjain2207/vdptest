import { test, expect } from '../fixtures/test';
import { buildProfileUpdateData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { getOwnProfile, updateOwnProfileViaApi, type ProfileUpdatePayload } from '../utils/seed';

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
  test('updates profile text fields from settings', async ({ auth, env, request, editProfilePage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const originalProfile = await getOwnProfile(request, 'user');
    const rollbackBody = profileSnapshotToUpdateBody(originalProfile);
    const update = buildProfileUpdateData();

    try {
      await auth.loginAsPrimaryUser('/settings/profile');
      await editProfilePage.expectLoaded();
      await editProfilePage.fillForm({
        bio: update.bio,
        company: update.company,
        description: update.description,
        website: update.website,
      });
      await editProfilePage.save();

      await expect(editProfilePage.page.locator('#bio')).toHaveValue(update.bio);
      await expect(editProfilePage.page.locator('#company')).toHaveValue(update.company);
      await expect(editProfilePage.page.locator('#description')).toHaveValue(update.description);
      await expect(editProfilePage.page.locator('#website')).toHaveValue(update.website);
    } finally {
      await updateOwnProfileViaApi(request, 'user', rollbackBody);
    }
  });
});
