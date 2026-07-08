import { test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { getE2EConfig } from '../utils/env';
import { readJsonFixture } from '../utils/seed';

test.describe('follow and unfollow', () => {
  test.use({ storageState: storageStatePaths.normalUser });

  test('User follows and unfollows another user', async ({ userProfilePage }) => {
    const followUserData = readJsonFixture<{ targetHandle: string }>('e2e/test-data/profile/followUserData.json');
    const targetHandle = followUserData.targetHandle.replace('{{secondaryUserHandle}}', getE2EConfig().secondaryUser.handle ?? '');

    await userProfilePage.goto(targetHandle);
    await userProfilePage.follow();
    await userProfilePage.expectFollowButtonLabel(/following|unfollow/i);
    await userProfilePage.follow();
    await userProfilePage.expectFollowButtonLabel(/follow/i);
  });

  test('User cannot follow themselves', async ({ normalUserAuth, userProfilePage }) => {
    await userProfilePage.goto(normalUserAuth.credentials.handle ?? normalUserAuth.credentials.email);
    await userProfilePage.expectOwnProfileFollowUnavailable();
  });
});
