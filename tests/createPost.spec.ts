import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { mediaFixturePath } from '../utils/mediaFiles';
import { uniquePostText } from '../utils/randomData';

type TextPostData = {
  contentPrefix: string;
};

type UnsupportedMediaData = {
  fileName: string;
};

test.describe('create post', () => {
  test.beforeEach(async ({ normalUserAuth, homeFeedPage }) => {
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });
    await homeFeedPage.open();
    await homeFeedPage.expectLoaded();
  });

  test('Create Text Post with Valid Content', async ({ createPostPage, homeFeedPage }) => {
    const data = loadTestData<TextPostData>('validTextPost.json');
    const content = uniquePostText(data.contentPrefix);

    await createPostPage.createTextPost(content);
    await homeFeedPage.expectPostVisible(content);
  });

  test('Create Post with Unsupported Media File Type', async ({ createPostPage }) => {
    const data = loadTestData<UnsupportedMediaData>('unsupportedMediaFile.json');

    await createPostPage.uploadUnsupportedMedia(mediaFixturePath(data.fileName));
    await createPostPage.expectUnsupportedMediaValidation();
  });
});
