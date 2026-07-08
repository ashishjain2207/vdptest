import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueMessage } from '../utils/randomData';

type MessageData = {
  messagePrefix: string;
};

test.describe('messaging', () => {
  test('Send Private Message to Followed User', async ({ normalUserAuth, userProfilePage, messagingPage, followedUserSetup }) => {
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });
    test.skip(!followedUserSetup.userId && !followedUserSetup.username, 'Set followed user profile identifiers for messaging validation.');
    const data = loadTestData<MessageData>('validMessage.json');
    const message = uniqueMessage(data.messagePrefix);

    await userProfilePage.openProfile(followedUserSetup.userId || followedUserSetup.username);
    await userProfilePage.openMessages();
    await messagingPage.sendMessage(message);
    await messagingPage.expectMessageDelivered(message);
  });
});
