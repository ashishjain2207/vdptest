import { test } from '../fixtures/test';
import { ensureTargetUser } from '../utils/seed';
import followUserData from '../test-data/profile/followUserData.json';

test.describe('follow and unfollow', () => {
  test('User follows and unfollows another user', async ({ request, normalUserAuth, userProfilePage }) => {
    const targetUser = await ensureTargetUser(request);

    await normalUserAuth.signIn();
    await userProfilePage.gotoUserProfile(targetUser.id ?? targetUser.username ?? followUserData.targetUsername);
    const initialFollowersCount = await userProfilePage.getFollowersCountText();

    await userProfilePage.follow();
    await userProfilePage.expectFollowing();
    await userProfilePage.expectFollowersCountChanged(initialFollowersCount);

    const followedFollowersCount = await userProfilePage.getFollowersCountText();
    await userProfilePage.unfollow();
    await userProfilePage.expectNotFollowing();
    await userProfilePage.expectFollowersCountChanged(followedFollowersCount);
  });

  test('User cannot follow themselves', async ({ normalUserAuth, userProfilePage }) => {
    await normalUserAuth.signIn();
    await userProfilePage.gotoOwnProfile();

    await userProfilePage.expectCannotFollowSelf();
  });
});
