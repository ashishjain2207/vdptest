import { test } from '../fixtures/test';
import { cleanupCreatedPost } from '../utils/cleanup';
import { uniquePostText } from '../utils/dataFactory';
import { uploadFiles } from '../utils/uploadFiles';
import validTextPostData from '../test-data/posts/validTextPostData.json';
import emptyPostData from '../test-data/posts/emptyPostData.json';
import unsupportedMediaFile from '../test-data/posts/unsupportedMediaFile.json';

test.describe('create post', () => {
  test.afterEach(async ({ request }) => {
    await cleanupCreatedPost(request);
  });

  test('User creates a valid text post', async ({
    normalUserAuth,
    homeFeedPage,
    createPostPage,
    userProfilePage,
  }) => {
    const postText = uniquePostText(validTextPostData.textPrefix);

    await normalUserAuth.signIn();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePost();
    await createPostPage.createTextPost(postText, validTextPostData.visibility);

    await createPostPage.expectPostCreated(postText);
    await homeFeedPage.goto();
    await homeFeedPage.expectPostVisible(postText);
    await userProfilePage.gotoOwnProfile();
    await userProfilePage.expectPostVisible(postText);
  });

  test('Post creation fails with empty text and no media', async ({ normalUserAuth, createPostPage }) => {
    await normalUserAuth.signIn();
    await createPostPage.gotoFromFeed();
    await createPostPage.fillPost({ text: emptyPostData.text });
    await createPostPage.submit();

    await createPostPage.expectValidationError(/empty|required|post/i);
    await createPostPage.expectOnCreatePost();
  });

  test('User uploads unsupported media file type in post', async ({ normalUserAuth, createPostPage }) => {
    await normalUserAuth.signIn();
    await createPostPage.gotoFromFeed();
    await createPostPage.fillPost({ mediaPath: uploadFiles.unsupportedMedia });
    await createPostPage.submit();

    await createPostPage.expectValidationError(new RegExp(unsupportedMediaFile.expectedError, 'i'));
    await createPostPage.expectOnCreatePost();
  });
});
