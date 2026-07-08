import { userSetupTest } from './userSetup.fixture';
import { getE2EUser, type E2EUser } from './auth.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

export type PostSetup = {
  owner: E2EUser;
  content: string;
  updatedContent?: string;
  postPath?: string;
};

export type PostSetupFixtures = {
  ownedPostSetup: PostSetup;
  otherUserPostSetup: PostSetup;
};

type EditPostData = {
  originalContent: string;
  updatedContent: string;
};

export const postSetupTest = userSetupTest.extend<PostSetupFixtures>({
  ownedPostSetup: async ({ normalUserAuth }, use) => {
    const data = loadTestData<EditPostData>('editPostValid.json');
    await use({
      owner: normalUserAuth,
      content: uniquePostText(data.originalContent),
      updatedContent: uniquePostText(data.updatedContent),
    });
  },

  otherUserPostSetup: async ({ otherUserSetup }, use) => {
    const data = loadTestData<EditPostData>('editPostValid.json');
    await use({
      owner: otherUserSetup.userId || otherUserSetup.username ? otherUserSetup : getE2EUser('other'),
      content: process.env.VDP_E2E_OTHER_USER_POST_TEXT ?? data.originalContent,
      postPath: process.env.VDP_E2E_OTHER_USER_POST_PATH ?? otherUserSetup.profilePath,
    });
  },
});
