import { test } from '../fixtures/test';

test.describe('access control', () => {
  test.use({ storageState: undefined });

  test('Guest user cannot access home feed', async ({ guestUser, homeFeedPage }) => {
    void guestUser;
    await homeFeedPage.goto();
    await homeFeedPage.expectAccessRestricted();
  });
});
