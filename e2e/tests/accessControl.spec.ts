import { test } from '../fixtures/test';

test.describe('access control', () => {
  test('guest user cannot access home feed', async ({ guestUser, homeFeedPage }) => {
    await guestUser.reset();
    await homeFeedPage.goto();
    await homeFeedPage.expectAccessDeniedRedirect();
  });
});
