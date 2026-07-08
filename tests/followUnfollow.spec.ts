import { test } from '../fixtures/test.fixture';

test.describe('follow and unfollow', () => {
  test('User Follows and Unfollows Another User', async ({ normalUserAuth, userProfilePage, otherUserSetup }) => {
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });
    test.skip(!otherUserSetup.userId && !otherUserSetup.username, 'Set other user profile identifiers for follow/unfollow validation.');

    await userProfilePage.openProfile(otherUserSetup.userId || otherUserSetup.username);
    await userProfilePage.follow();
    await userProfilePage.unfollow();
  });
});
