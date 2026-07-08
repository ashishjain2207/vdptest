import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { mediaFixturePath } from '../utils/mediaFiles';
import { uniquePostText } from '../utils/randomData';

type TextPostData = {
  textPrefix: string;
  visibility: string;
};

type UnsupportedMediaData = {
  fileName: string;
};

test.describe('Create post', () => {
  test('Create Text Post with Valid Content', async ({
    normalUserAuth,
    createPostPage,
    userProfilePage,
    homeFeedPage,
  }) => {
    const data = loadTestData<TextPostData>('test-data/validTextPost.json');
    const postText = uniquePostText(data.textPrefix);

    await normalUserAuth.login();
    await createPostPage.createTextPost(postText, data.visibility);
    await homeFeedPage.expectPostVisible(postText);
    await userProfilePage.goToCurrentUserProfile();
    await userProfilePage.expectPostVisible(postText);
  });

  test('Create Post with Unsupported Media File Type', async ({ normalUserAuth, createPostPage }) => {
    const data = loadTestData<UnsupportedMediaData>('test-data/unsupportedMediaFile.json');
    await normalUserAuth.login();
    await createPostPage.goTo();
    await createPostPage.uploadMedia(mediaFixturePath(data.fileName));
    await createPostPage.submitPost();
    await createPostPage.expectUnsupportedMediaValidation();
  });
});
