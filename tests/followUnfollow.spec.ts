import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';

test.describe('follow and unfollow', () => {
  test('User Follows and Unfollows Another User', async ({ loginPage, userProfilePage, normalUserAuth, otherUserSetup }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    test.skip(
      !process.env.E2E_OTHER_USER_PROFILE_KEY && !process.env.E2E_OTHER_USER_USERNAME,
      'Set E2E_OTHER_USER_PROFILE_KEY or E2E_OTHER_USER_USERNAME for follow/unfollow validation.',
    );

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    await userProfilePage.gotoProfile(otherUserSetup.profileKey);

    await userProfilePage.followUser();
    await userProfilePage.unfollowUser();
  });
});
