import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';
import { ownProfileKey, runtimePostText } from '../utils/seed';
import { uploadFiles } from '../utils/uploadFiles';

const validTextPostData = readTestData<{ textTemplate: string; visibility: string }>('test-data/posts/validTextPostData.json');
const emptyPostData = readTestData<{ expectedErrorPattern: string }>('test-data/posts/emptyPostData.json');
const unsupportedMediaFile = readTestData<{ filePathKey: keyof typeof uploadFiles; expectedErrorPattern: string }>('test-data/posts/unsupportedMediaFile.json');

test.describe('create post', () => {
  test('user creates a valid text post', async ({ normalUserAuth, homeFeedPage, createPostPage, userProfilePage }) => {
    const postText = runtimePostText(validTextPostData);

    await normalUserAuth.signIn();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePost();
    await createPostPage.createTextPost(postText, validTextPostData.visibility);
    await createPostPage.expectPostCreated(postText);
    await homeFeedPage.expectPostVisible(postText);

    await userProfilePage.gotoOwnProfile(ownProfileKey(normalUserAuth.credentials.profileSlug ?? normalUserAuth.credentials.userId ?? normalUserAuth.credentials.username));
    await userProfilePage.expectPostVisible(postText);
  });

  test('post creation fails with empty text and no media', async ({ normalUserAuth, homeFeedPage, createPostPage }) => {
    await normalUserAuth.signIn();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePost();
    await createPostPage.expectEmptyPostBlocked();
  });

  test('user uploads unsupported media file type in post', async ({ normalUserAuth, homeFeedPage, createPostPage }) => {
    await normalUserAuth.signIn();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePost();
    await createPostPage.uploadMedia(uploadFiles[unsupportedMediaFile.filePathKey]);
    await createPostPage.expectUnsupportedMediaBlocked(unsupportedMediaFile.expectedErrorPattern);
  });
});
