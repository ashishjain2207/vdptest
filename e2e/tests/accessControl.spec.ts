import { test } from '../fixtures/auth';
import { HomeFeedPage } from '../pages/HomeFeedPage';

test.describe('access control', () => {
  test('Guest user cannot access home feed', async ({ guestUser, page }) => {
    const homeFeedPage = new HomeFeedPage(page);

    await guestUser();
    await homeFeedPage.goto();
    await homeFeedPage.expectGuestRedirectedFromFeed();
  });
});
