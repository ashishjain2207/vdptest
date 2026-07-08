import { authTest, getE2EUser, type E2EUser } from './auth.fixture';

export type UserSetupFixtures = {
  existingUserSetup: E2EUser;
  otherUserSetup: E2EUser;
  followedUserSetup: E2EUser;
};

export const userSetupTest = authTest.extend<UserSetupFixtures>({
  existingUserSetup: async ({}, use) => {
    await use(getE2EUser('existing'));
  },

  otherUserSetup: async ({}, use) => {
    await use(getE2EUser('other'));
  },

  followedUserSetup: async ({}, use) => {
    await use(getE2EUser('followed'));
  },
});
