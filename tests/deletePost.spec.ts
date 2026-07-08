import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

type DeletePostData = {
  contentPrefix: string;
};

test.describe('delete post', () => {
  test('Delete Own Post with Confirmation', async ({
    normalUserAuth,
    homeFeedPage,
    createPostPage,
    userProfilePage,
    postDetailPage,
  }) => {
    test.skip(!normalUserAuth.userId && !normalUserAuth.username, 'Set normal user profile identifiers for own-profile navigation.');
    const data = loadTestData<DeletePostData>('deletePost.json');
    const content = uniquePostText(data.contentPrefix);

    await homeFeedPage.open();
    await createPostPage.createTextPost(content);
    await userProfilePage.openProfile(normalUserAuth.userId || normalUserAuth.username);
    await userProfilePage.openPost(content);
    await postDetailPage.deletePost();
    await userProfilePage.openProfile(normalUserAuth.userId || normalUserAuth.username);
    await userProfilePage.expectPostHidden(content);
  });
});
