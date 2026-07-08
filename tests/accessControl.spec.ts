import { test } from '../fixtures/test.fixture';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { LoginPage } from '../pages/LoginPage';

test.describe('guest access control', () => {
  test('Guest User Cannot Access Home Feed', async ({ guestUser }) => {
    const homeFeedPage = new HomeFeedPage(guestUser);

    await homeFeedPage.open();
    await homeFeedPage.expectGuestRedirectedToLogin();
  });

  test('Guest User Cannot Send Messages', async ({ guestUser }) => {
    const loginPage = new LoginPage(guestUser);

    await guestUser.goto('/messages');
    await loginPage.expectLoginPage();
  });
});
