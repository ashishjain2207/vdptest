import { test as authTest, type UserCredentials } from './auth.fixture';

export type UserSetup = {
  username: string;
  displayName: string;
  userId?: string;
};

export type UserSetupFixtures = {
  existingUserSetup: UserSetup;
  otherUserSetup: UserSetup;
  followedUserSetup: UserSetup;
};

function setupFromEnv(prefix: 'E2E_EXISTING_USER' | 'E2E_OTHER_USER' | 'E2E_FOLLOWED_USER', fallback?: Partial<UserCredentials>): UserSetup {
  return {
    username: process.env[`${prefix}_USERNAME`] ?? fallback?.username ?? '',
    displayName: process.env[`${prefix}_DISPLAY_NAME`] ?? fallback?.displayName ?? '',
    userId: process.env[`${prefix}_ID`] ?? fallback?.userId,
  };
}

export const test = authTest.extend<UserSetupFixtures>({
  existingUserSetup: async ({ normalUserAuth }, use, testInfo) => {
    const user = setupFromEnv('E2E_EXISTING_USER', normalUserAuth);
    testInfo.skip(!user.username, 'Set E2E_EXISTING_USER_USERNAME or E2E_USER_USERNAME for duplicate username checks.');
    await use(user);
  },

  otherUserSetup: async ({}, use, testInfo) => {
    const user = setupFromEnv('E2E_OTHER_USER');
    testInfo.skip(!user.username && !user.userId, 'Set E2E_OTHER_USER_USERNAME or E2E_OTHER_USER_ID.');
    await use(user);
  },

  followedUserSetup: async ({ otherUserSetup }, use, testInfo) => {
    const user = setupFromEnv('E2E_FOLLOWED_USER', otherUserSetup);
    testInfo.skip(!user.username && !user.userId, 'Set E2E_FOLLOWED_USER_USERNAME or E2E_FOLLOWED_USER_ID.');
    await use(user);
  },
});
