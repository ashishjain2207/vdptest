import { test, loginAs } from '../fixtures/test.fixture';
import { uniqueMessage } from '../utils/randomData';
import { loadTestData } from '../utils/testDataLoader';

test.describe('Messaging', () => {
  test('Send Private Message to Followed User', async ({
    page,
    normalUserAuth,
    followedUserSetup,
    messagingPage,
  }) => {
    const data = loadTestData<{ messagePrefix: string }>('validMessage.json');
    const message = uniqueMessage(data.messagePrefix);

    await loginAs(page, normalUserAuth);
    if (followedUserSetup.userId) {
      await messagingPage.gotoMessages(followedUserSetup.userId);
    } else {
      await messagingPage.gotoMessages();
      await messagingPage.startNewMessage();
      await messagingPage.selectRecipient(followedUserSetup.displayName || followedUserSetup.username);
    }
    await messagingPage.sendMessage(message);
  });
});
