import { authTest, type UserCredentials } from './auth.fixture';
import { loadTestData } from '../utils/testDataLoader';

type DuplicateUsernameData = {
  username: string;
  email: string;
  password: string;
  name: string;
};

export type UserSetup = UserCredentials & {
  displayName: string;
  profileKey: string;
};

export type UserSetupFixtures = {
  existingUserSetup: UserSetup;
  otherUserSetup: UserSetup;
  followedUserSetup: UserSetup;
};

function setupUser(prefix: string, fallback: Partial<UserSetup> = {}): UserSetup {
  const username = process.env[`${prefix}_USERNAME`] ?? fallback.username ?? '';
  const displayName = process.env[`${prefix}_DISPLAY_NAME`] ?? fallback.displayName ?? username;

  return {
    email: process.env[`${prefix}_EMAIL`] ?? fallback.email ?? '',
    password: process.env[`${prefix}_PASSWORD`] ?? fallback.password ?? '',
    username,
    displayName,
    profileKey: process.env[`${prefix}_PROFILE_KEY`] ?? fallback.profileKey ?? username,
  };
}

export const userSetupTest = authTest.extend<UserSetupFixtures>({
  existingUserSetup: async ({ normalUserAuth }, use) => {
    const duplicateData = loadTestData<DuplicateUsernameData>('duplicateUsername.json');
    await use(setupUser('E2E_EXISTING_USER', {
      email: normalUserAuth.email || duplicateData.email,
      password: normalUserAuth.password || duplicateData.password,
      username: normalUserAuth.username || duplicateData.username,
      displayName: normalUserAuth.displayName || duplicateData.name,
      profileKey: normalUserAuth.profileKey || duplicateData.username,
    }));
  },
  otherUserSetup: async ({}, use) => {
    await use(setupUser('E2E_OTHER_USER', {
      username: 'other-user',
      displayName: 'Other User',
      profileKey: 'other-user',
    }));
  },
  followedUserSetup: async ({}, use) => {
    await use(setupUser('E2E_FOLLOWED_USER', {
      username: 'followed-user',
      displayName: 'Followed User',
      profileKey: 'followed-user',
    }));
  },
});
