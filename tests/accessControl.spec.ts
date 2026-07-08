import { test } from '../fixtures/test.fixture';
import { routes } from '../pages/BasePage';

test.describe('access control', () => {
  test('Guest User Cannot Access Home Feed', async ({ guestUser, homeFeedPage }) => {
    await guestUser.goto(routes.feed);
    await homeFeedPage.expectGuestRedirectedToLogin();
  });

  test('Guest User Cannot Send Messages', async ({ guestUser, loginPage }) => {
    await guestUser.goto(routes.messages);
    await loginPage.expectLoginPage();
  });
});
