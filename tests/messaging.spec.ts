import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueMessage } from '../utils/randomData';

type MessageData = {
  messagePrefix: string;
};

test.describe('messaging', () => {
  test('Send Private Message to Followed User', async ({
    loginPage,
    userProfilePage,
    messagingPage,
    normalUserAuth,
    followedUserSetup,
  }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    test.skip(
      !process.env.E2E_FOLLOWED_USER_PROFILE_KEY && !process.env.E2E_FOLLOWED_USER_USERNAME,
      'Set E2E_FOLLOWED_USER_PROFILE_KEY or E2E_FOLLOWED_USER_USERNAME for messaging validation.',
    );
    const data = loadTestData<MessageData>('validMessage.json');
    const messageText = uniqueMessage(data.messagePrefix);

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    await userProfilePage.gotoProfile(followedUserSetup.profileKey);
    await userProfilePage.expectMessageButtonVisible();
    await userProfilePage.openMessageComposer();
    await messagingPage.sendMessage(messageText);

    await messagingPage.expectMessageDelivered(messageText);
  });
});
