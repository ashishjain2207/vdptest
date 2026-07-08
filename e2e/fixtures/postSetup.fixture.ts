import { test as userTest } from './userSetup.fixture';
import { uniquePostText } from '../utils/randomData';

export type PostSetup = {
  id?: string;
  content: string;
  updatedContent: string;
  ownerUsername?: string;
};

export type PostSetupFixtures = {
  ownedPostSetup: PostSetup;
  otherUserPostSetup: PostSetup;
};

export const test = userTest.extend<PostSetupFixtures>({
  ownedPostSetup: async ({ normalUserAuth }, use) => {
    await use({
      content: uniquePostText('E2E owned post'),
      updatedContent: uniquePostText('E2E edited post'),
      ownerUsername: normalUserAuth.username,
    });
  },

  otherUserPostSetup: async ({ otherUserSetup }, use, testInfo) => {
    const content = process.env.E2E_OTHER_USER_POST_CONTENT ?? '';
    const id = process.env.E2E_OTHER_USER_POST_ID;
    testInfo.skip(!content && !id, 'Set E2E_OTHER_USER_POST_CONTENT or E2E_OTHER_USER_POST_ID.');
    await use({
      id,
      content,
      updatedContent: uniquePostText('E2E unauthorized edit attempt'),
      ownerUsername: otherUserSetup.username,
    });
  },
});
