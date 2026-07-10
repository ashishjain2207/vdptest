import { expect, test } from '../fixtures/auth';
import { CreatePostPage } from '../pages/CreatePostPage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { loadTestData } from '../utils/testData';

type ValidTextPostData = {
  content: string;
  visibility: string;
};

type EmptyPostData = {
  content: string;
};

type UnsupportedMediaFile = {
  fileName: string;
};

const validTextPostData = loadTestData<ValidTextPostData>('validTextPostData.json');
const emptyPostData = loadTestData<EmptyPostData>('emptyPostData.json');
const unsupportedMediaFile = loadTestData<UnsupportedMediaFile>('unsupportedMediaFile.json');

test.describe('create post', () => {
  test('User creates a valid text post', async ({ page, normalUserAuth }) => {
    const homeFeedPage = new HomeFeedPage(page);
    const createPostPage = new CreatePostPage(page);
    const uniqueText = `${validTextPostData.content} ${Date.now()}`;

    await normalUserAuth();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePostComposer();
    await createPostPage.enterPostText(uniqueText);
    await createPostPage.selectVisibility(validTextPostData.visibility);
    await createPostPage.submit();

    await createPostPage.expectPostVisible(uniqueText);
    await homeFeedPage.expectFeedVisible();
  });

  test('Post creation fails with empty text and no media', async ({ page, normalUserAuth }) => {
    const createPostPage = new CreatePostPage(page);

    await normalUserAuth();
    await page.goto('/posts');
    await createPostPage.openComposer();
    await createPostPage.enterPostText(emptyPostData.content);
    await createPostPage.submit();

    await createPostPage.expectEmptyPostValidationError();
  });

  test('User uploads unsupported media file type in post', async ({ page, normalUserAuth }) => {
    const createPostPage = new CreatePostPage(page);

    await normalUserAuth();
    await page.goto('/posts');
    await createPostPage.openComposer();
    await createPostPage.uploadUnsupportedMedia(unsupportedMediaFile.fileName);
    await createPostPage.submit();

    await createPostPage.expectUnsupportedMediaError();
    await expect(page).toHaveURL(/\/posts(?:\?.*)?$/);
  });
});
