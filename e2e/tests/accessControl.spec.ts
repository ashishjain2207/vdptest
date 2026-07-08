import { test } from '../fixtures/test';

test.describe('access control', () => {
  test('Guest user cannot access home feed', async ({ guestUser, homeFeedPage }) => {
    await guestUser.signOut();
    await homeFeedPage.goto();

    await homeFeedPage.expectGuestRedirectedAway();
  });
});
