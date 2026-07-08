import { test } from '../fixtures/test.fixture';

test.describe('Guest access control', () => {
  test('Guest User Cannot Access Home Feed', async ({ guestUser, homeFeedPage }) => {
    await guestUser.reset();
    await homeFeedPage.goTo();
    await homeFeedPage.expectGuestRedirect();
  });

  test('Guest User Cannot Send Messages', async ({ guestUser, userProfilePage, otherUserSetup }) => {
    await guestUser.reset();
    await userProfilePage.goTo(otherUserSetup);
    await userProfilePage.expectMessageUnavailableForGuest();
  });
});
