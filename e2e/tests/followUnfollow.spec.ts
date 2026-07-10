import { test } from '../fixtures/auth';
import { UserProfilePage } from '../pages/UserProfilePage';
import { loadTestData } from '../utils/testData';

type FollowUserData = {
  targetUserId: string;
  ownUserId: string;
};

const followUserData = loadTestData<FollowUserData>('followUserData.json');

test.describe('follow and unfollow', () => {
  test('User follows and unfollows another user', async ({ page, normalUserAuth }) => {
    const userProfilePage = new UserProfilePage(page);

    await normalUserAuth();
    await userProfilePage.gotoUserProfile(followUserData.targetUserId);
    await userProfilePage.followUser();
    await userProfilePage.expectFollowState(true);
    await userProfilePage.unfollowUser();
    await userProfilePage.expectFollowState(false);
  });

  test('User cannot follow themselves', async ({ page, normalUserAuth }) => {
    const userProfilePage = new UserProfilePage(page);

    await normalUserAuth();
    await userProfilePage.gotoOwnProfile(followUserData.ownUserId);
    await userProfilePage.expectCannotFollowSelf();
  });
});
