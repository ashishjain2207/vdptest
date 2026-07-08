import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';
import { ownProfileKey, seededTargetProfileKey } from '../utils/seed';

const followUserData = readTestData<{
  targetProfileFallback: string;
}>('test-data/profile/followUserData.json');

test.describe('follow and unfollow', () => {
  test('user follows and unfollows another user', async ({ normalUserAuth, userProfilePage }) => {
    await normalUserAuth.signIn();
    await userProfilePage.gotoProfile(seededTargetProfileKey(followUserData.targetProfileFallback));
    await userProfilePage.follow();
    await userProfilePage.expectFollowingState();
    await userProfilePage.unfollow();
    await userProfilePage.expectNotFollowingState();
  });

  test('user cannot follow themselves', async ({ normalUserAuth, userProfilePage }) => {
    await normalUserAuth.signIn();
    await userProfilePage.gotoOwnProfile(ownProfileKey(normalUserAuth.credentials.profileSlug ?? normalUserAuth.credentials.userId ?? normalUserAuth.credentials.username));
    await userProfilePage.expectSelfFollowPrevented();
  });
});
