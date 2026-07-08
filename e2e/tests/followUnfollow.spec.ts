import { test } from '../fixtures/test.fixture';

test.describe('Follow and unfollow', () => {
  test('User Follows and Unfollows Another User', async ({ normalUserAuth, otherUserSetup, userProfilePage }) => {
    await normalUserAuth.login();
    await userProfilePage.goTo(otherUserSetup);
    await userProfilePage.follow();
    await userProfilePage.expectFollowingState();
    await userProfilePage.unfollow();
    await userProfilePage.expectNotFollowingState();
  });
});
