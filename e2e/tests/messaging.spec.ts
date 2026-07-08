import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueMessage } from '../utils/randomData';

type MessageData = {
  textPrefix: string;
};

test.describe('Messaging', () => {
  test('Send Private Message to Followed User', async ({
    normalUserAuth,
    followedUserSetup,
    userProfilePage,
    messagingPage,
  }) => {
    const data = loadTestData<MessageData>('test-data/validMessage.json');
    const message = uniqueMessage(data.textPrefix);

    await normalUserAuth.login();
    await userProfilePage.goTo(followedUserSetup);
    await userProfilePage.openMessageComposer();
    await messagingPage.sendMessage(message);
    await messagingPage.expectMessageDelivered(message);
  });
});
