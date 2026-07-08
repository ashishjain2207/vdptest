import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { getRoleMissingReason } from '../utils/env';
import { extractId, getProfileByHandle, unfollowUserViaApi } from '../utils/seed';

test.describe('follow / unfollow', () => {
  test('toggles the follow button on another user profile', async ({ auth, env, request, userProfilePage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));
    test.skip(!env.targetUserHandle, 'Requires E2E_TARGET_USER_HANDLE or E2E_SECONDARY_USER_HANDLE.');

    const cleanup = new CleanupRegistry();
    const targetProfile = await getProfileByHandle(request, env.targetUserHandle);
    const targetUserId = extractId(targetProfile, 'userId', 'UserId', 'id', 'Id');

    await unfollowUserViaApi(request, 'user', targetUserId);
    cleanup.trackFollow('user', targetUserId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await userProfilePage.goto(env.targetUserHandle);
      await userProfilePage.expectLoaded();

      const initialLabel = (await userProfilePage.followButton.textContent())?.trim() ?? '';
      await userProfilePage.toggleFollow();
      await expect
        .poll(async () => (await userProfilePage.followButton.textContent())?.trim() ?? '')
        .not.toBe(initialLabel);

      await userProfilePage.toggleFollow();
      await expect
        .poll(async () => (await userProfilePage.followButton.textContent())?.trim() ?? '')
        .toBe(initialLabel);

      await cleanup.run(request);
    } finally {
      await cleanup.run(request);
    }
  });
});
