import { test } from '../fixtures/test';

test.describe('e2e/tests/accessControl.spec.ts', () => {
  test('Guest user cannot access home feed', async ({ guestUser, makePages }) => {
    const { homeFeedPage } = makePages(guestUser.page);

    await homeFeedPage.goto();
    await homeFeedPage.expectGuestAccessBlocked();
  });
});
