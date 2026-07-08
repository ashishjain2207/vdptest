import { test } from '../fixtures/test.fixture';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { MessagingPage } from '../pages/MessagingPage';

test.describe('Guest access control', () => {
  test('Guest User Cannot Access Home Feed', async ({ guestUser }) => {
    const homeFeedPage = new HomeFeedPage(guestUser);

    await homeFeedPage.gotoFeed();
    await homeFeedPage.expectGuestRedirectedToLogin();
  });

  test('Guest User Cannot Send Messages', async ({ guestUser }) => {
    const messagingPage = new MessagingPage(guestUser);

    await messagingPage.gotoMessages();
    await messagingPage.expectGuestCannotSendMessages();
  });
});
