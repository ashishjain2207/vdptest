import { test, loginAs } from '../fixtures/test.fixture';

test.describe('Follow and unfollow', () => {
  test('User Follows and Unfollows Another User', async ({
    page,
    normalUserAuth,
    otherUserSetup,
    userProfilePage,
  }) => {
    await loginAs(page, normalUserAuth);
    await userProfilePage.gotoProfile(otherUserSetup.username || otherUserSetup.userId || '');

    await userProfilePage.follow();
    await userProfilePage.expectFollowing();
    await userProfilePage.unfollow();
    await userProfilePage.expectNotFollowing();
  });
});
