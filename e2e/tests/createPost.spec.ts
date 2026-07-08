import { test, loginAs } from '../fixtures/test.fixture';
import { unsupportedUploadPath } from '../utils/mediaFiles';
import { uniquePostText } from '../utils/randomData';
import { loadTestData } from '../utils/testDataLoader';

test.describe('Create post', () => {
  test.beforeEach(async ({ page, normalUserAuth, homeFeedPage }) => {
    await loginAs(page, normalUserAuth);
    await homeFeedPage.gotoFeed();
    await homeFeedPage.expectLoaded();
  });

  test('Create Text Post with Valid Content', async ({ createPostPage, homeFeedPage }) => {
    const data = loadTestData<{ contentPrefix: string }>('validTextPost.json');
    const content = uniquePostText(data.contentPrefix);

    await createPostPage.createTextPost(content);
    await homeFeedPage.expectPostVisible(content);
  });

  test('Create Post with Unsupported Media File Type', async ({ createPostPage }) => {
    const data = loadTestData<{ fileName: string }>('unsupportedMediaFile.json');

    await createPostPage.uploadUnsupportedMedia(unsupportedUploadPath(data.fileName));
    await createPostPage.expectUnsupportedMediaRejected();
  });
});
