import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

type EditPostData = {
  originalTextPrefix: string;
  updatedTextPrefix: string;
};

export type TestPost = {
  postId?: string;
  content: string;
  postPath?: string;
  authorHandle?: string;
};

export type PostSetupFixtures = {
  otherUserPostSetup: TestPost;
  ownedPostSetup: TestPost;
};

export const postSetupFixtures = {
  otherUserPostSetup: async ({}, use: (post: TestPost) => Promise<void>) => {
    const content = process.env.E2E_OTHER_USER_POST_TEXT ?? 'E2E other user visible post';
    const postId = process.env.E2E_OTHER_USER_POST_ID;
    await use({
      postId,
      content,
      postPath: postId ? `/posts/${encodeURIComponent(postId)}` : undefined,
      authorHandle: process.env.E2E_OTHER_USER_HANDLE ?? 'e2e-other-user',
    });
  },
  ownedPostSetup: async ({}, use: (post: TestPost) => Promise<void>) => {
    const data = loadTestData<EditPostData>('test-data/editPostValid.json');
    const postId = process.env.E2E_OWNED_POST_ID;
    await use({
      postId,
      content: process.env.E2E_OWNED_POST_TEXT ?? uniquePostText(data.originalTextPrefix),
      postPath: postId ? `/posts/${encodeURIComponent(postId)}` : undefined,
      authorHandle: process.env.E2E_NORMAL_USER_HANDLE,
    });
  },
};
