import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { mediaFilePath } from '../utils/mediaFiles';
import { uniquePostText } from '../utils/randomData';

type ValidTextPostData = {
  contentPrefix: string;
};

type UnsupportedMediaData = {
  fileName: string;
};

async function signInForPosts(loginPage: { login: (email: string, password: string, returnUrl?: string) => Promise<void> }, user: { email: string; password: string }) {
  await loginPage.login(user.email, user.password, '/posts');
}

test.describe('post creation', () => {
  test('Create Text Post with Valid Content', async ({ loginPage, createPostPage, homeFeedPage, normalUserAuth }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<ValidTextPostData>('validTextPost.json');
    const content = uniquePostText(data.contentPrefix);

    await signInForPosts(loginPage, normalUserAuth);
    await createPostPage.gotoComposer();
    await createPostPage.createTextPost(content);

    await homeFeedPage.expectPostVisible(content);
  });

  test('Create Post with Unsupported Media File Type', async ({ loginPage, createPostPage, normalUserAuth }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<UnsupportedMediaData>('unsupportedMediaFile.json');

    await signInForPosts(loginPage, normalUserAuth);
    await createPostPage.gotoComposer();
    await createPostPage.uploadMedia(mediaFilePath(data.fileName));

    await createPostPage.expectUnsupportedMediaValidation();
  });
});
