import { loadTestData } from '../utils/testDataLoader';

type DuplicateUserData = {
  fullName: string;
  username: string;
  emailPrefix: string;
  emailDomain: string;
};

export type TestUser = {
  userId?: string;
  handle: string;
  username: string;
  email: string;
  displayName: string;
  profilePath: string;
};

export type UserSetupFixtures = {
  existingUserSetup: TestUser;
  otherUserSetup: TestUser;
  followedUserSetup: TestUser;
};

function profilePathFor(userId?: string, handle?: string): string {
  const key = userId ?? handle;
  if (!key) {
    throw new Error('A seeded test user must define a user id or handle.');
  }
  return `/profile/${encodeURIComponent(key)}`;
}

function seededUser(prefix: string, fallbackHandle: string, fallbackEmail: string, fallbackName: string): TestUser {
  const userId = process.env[`E2E_${prefix}_USER_ID`];
  const handle = process.env[`E2E_${prefix}_USER_HANDLE`] ?? fallbackHandle;
  return {
    userId,
    handle,
    username: handle,
    email: process.env[`E2E_${prefix}_USER_EMAIL`] ?? fallbackEmail,
    displayName: process.env[`E2E_${prefix}_USER_NAME`] ?? fallbackName,
    profilePath: profilePathFor(userId, handle),
  };
}

export const userSetupFixtures = {
  existingUserSetup: async ({}, use: (user: TestUser) => Promise<void>) => {
    const data = loadTestData<DuplicateUserData>('test-data/duplicateUsername.json');
    const username = process.env.E2E_EXISTING_USERNAME ?? data.username;
    await use({
      userId: process.env.E2E_EXISTING_USER_ID,
      handle: username,
      username,
      email: process.env.E2E_EXISTING_USER_EMAIL ?? `${data.emailPrefix}.${username}@${data.emailDomain}`,
      displayName: process.env.E2E_EXISTING_USER_NAME ?? data.fullName,
      profilePath: profilePathFor(process.env.E2E_EXISTING_USER_ID, username),
    });
  },
  otherUserSetup: async ({}, use: (user: TestUser) => Promise<void>) => {
    await use(seededUser('OTHER', 'e2e-other-user', 'e2e.other@example.com', 'E2E Other User'));
  },
  followedUserSetup: async ({}, use: (user: TestUser) => Promise<void>) => {
    await use(seededUser('FOLLOWED', 'e2e-followed-user', 'e2e.followed@example.com', 'E2E Followed User'));
  },
};
