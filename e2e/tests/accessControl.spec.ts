import { test, expect } from '../fixtures/test';

test.describe('access control', () => {
  test('Guest user cannot access home feed', async ({ guestUser, loginPage }) => {
    await guestUser.goto('/posts', { waitUntil: 'domcontentloaded' });

    await expect(guestUser).toHaveURL(/\/login$/);
    await loginPage.expectLoaded();
  });
});
