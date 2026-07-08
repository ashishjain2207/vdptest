import { userSetupTest } from './userSetup.fixture';
import { loadTestData } from '../utils/testDataLoader';

type PostData = {
  content?: string;
  originalContent?: string;
  updatedContent?: string;
  postId?: string;
};

export type PostSetup = {
  id: string;
  content: string;
  authorProfileKey?: string;
};

export type PostSetupFixtures = {
  ownedPostSetup: PostSetup;
  otherUserPostSetup: PostSetup;
  commentPostSetup: PostSetup;
};

function postSetup(prefix: string, fallback: Partial<PostSetup>): PostSetup {
  return {
    id: process.env[`${prefix}_ID`] ?? fallback.id ?? '',
    content: process.env[`${prefix}_CONTENT`] ?? fallback.content ?? '',
    authorProfileKey: process.env[`${prefix}_AUTHOR_PROFILE_KEY`] ?? fallback.authorProfileKey,
  };
}

export const postSetupTest = userSetupTest.extend<PostSetupFixtures>({
  ownedPostSetup: async ({ normalUserAuth }, use) => {
    const data = loadTestData<PostData>('editPostValid.json');
    await use(postSetup('E2E_OWNED_POST', {
      id: data.postId,
      content: data.originalContent,
      authorProfileKey: normalUserAuth.profileKey,
    }));
  },
  otherUserPostSetup: async ({ otherUserSetup }, use) => {
    const data = loadTestData<PostData>('editPostValid.json');
    await use(postSetup('E2E_OTHER_USER_POST', {
      id: data.postId,
      content: data.originalContent,
      authorProfileKey: otherUserSetup.profileKey,
    }));
  },
  commentPostSetup: async ({ normalUserAuth }, use) => {
    const data = loadTestData<PostData>('validComment.json');
    await use(postSetup('E2E_COMMENT_POST', {
      id: data.postId,
      content: data.content,
      authorProfileKey: normalUserAuth.profileKey,
    }));
  },
});
