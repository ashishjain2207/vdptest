import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

type DeletePostData = {
  textPrefix: string;
};

test.describe('Delete post', () => {
  test('Delete Own Post with Confirmation', async ({
    normalUserAuth,
    ownedPostSetup,
    userProfilePage,
    postDetailPage,
  }) => {
    const data = loadTestData<DeletePostData>('test-data/deletePost.json');
    const postText = ownedPostSetup.content || data.textPrefix;

    await normalUserAuth.login();
    if (ownedPostSetup.postId) {
      await postDetailPage.goToPost(ownedPostSetup.postId);
    } else {
      await userProfilePage.goToCurrentUserProfile();
      await userProfilePage.openPost(postText);
    }
    await postDetailPage.deletePostWithConfirmation();
    await postDetailPage.expectDeletionConfirmed();
    await userProfilePage.goToCurrentUserProfile();
    await userProfilePage.expectPostRemoved(postText);
  });
});
