import { test } from '../fixtures/test';
import { getFollowTargetSeed } from '../utils/seed';

test.describe('e2e/tests/followUnfollow.spec.ts', () => {
  test('User follows and unfollows another user', async ({ normalUserAuth, makePages }) => {
    const { userProfilePage } = makePages(normalUserAuth.page);
    const seed = getFollowTargetSeed();

    await userProfilePage.goto(seed.profileKey);
    await userProfilePage.followUser();
    await userProfilePage.expectFollowButtonState(/following|unfollow/i);
    await userProfilePage.followUser();
    await userProfilePage.expectFollowButtonState(/^follow$/i);
  });

  test('User cannot follow themselves', async ({ normalUserAuth, makePages, appConfig }) => {
    const { userProfilePage } = makePages(normalUserAuth.page);

    test.skip(!appConfig.normalUser.profileKey, 'Set E2E_NORMAL_USER_PROFILE_KEY to validate the self-follow scenario.');

    await userProfilePage.goto(appConfig.normalUser.profileKey ?? '');
    await userProfilePage.expectSelfFollowUnavailable();
  });
});
