import { test } from '../fixtures/test';
import { loadJsonFixture, resolveFixtureTokens } from '../utils/seed';
import { uniquePostText, uniqueSuffix } from '../utils/dataFactory';
import { uploadFiles } from '../utils/uploadFiles';

interface PostFixtureData {
  content: string;
  visibility?: string;
}

const validPostTemplate = loadJsonFixture<PostFixtureData>('posts/validTextPostData.json');
const emptyPostTemplate = loadJsonFixture<PostFixtureData>('posts/emptyPostData.json');

test.describe('e2e/tests/createPost.spec.ts', () => {
  test('User creates a valid text post', async ({ normalUserAuth, makePages, appConfig }) => {
    const { homeFeedPage, createPostPage, userProfilePage } = makePages(normalUserAuth.page);
    const content = uniquePostText('IMRIVA valid text post');
    const data = resolveFixtureTokens(validPostTemplate, {
      UNIQUE_POST_TEXT: content,
      UNIQUE_SUFFIX: uniqueSuffix('post'),
    });

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(data.content || content);
    await createPostPage.selectVisibilityIfAvailable(data.visibility ?? 'Public');
    await createPostPage.submit();
    await homeFeedPage.expectPostVisible(data.content || content);

    if (appConfig.normalUser.profileKey) {
      await userProfilePage.goto(appConfig.normalUser.profileKey);
      await userProfilePage.expectPostVisible(data.content || content);
    }
  });

  test('Post creation fails with empty text and no media', async ({ normalUserAuth, makePages }) => {
    const { homeFeedPage, createPostPage } = makePages(normalUserAuth.page);

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(emptyPostTemplate.content);
    await createPostPage.expectEmptyPostBlocked();
  });

  test('User uploads unsupported media file type in post', async ({ normalUserAuth, makePages }) => {
    const { homeFeedPage, createPostPage } = makePages(normalUserAuth.page);

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.uploadMedia(uploadFiles.unsupportedMediaFile);
    await createPostPage.expectUnsupportedFileError();
  });
});
