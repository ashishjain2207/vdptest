import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueComment } from '../utils/randomData';

type CommentData = {
  textPrefix: string;
};

test.describe('Comments', () => {
  test('Add Comment to Post with Valid Text', async ({ normalUserAuth, ownedPostSetup, postDetailPage }) => {
    const data = loadTestData<CommentData>('test-data/validComment.json');
    const comment = uniqueComment(data.textPrefix);

    await normalUserAuth.login();
    if (!ownedPostSetup.postId) {
      throw new Error('Set E2E_OWNED_POST_ID to run comment scenarios against a seeded post.');
    }
    await postDetailPage.goToPost(ownedPostSetup.postId);
    await postDetailPage.addComment(comment);
    await postDetailPage.expectCommentVisible(comment);
    await postDetailPage.expectCommentCountIncremented();
  });

  test('Add Empty Comment Should Fail', async ({ normalUserAuth, ownedPostSetup, postDetailPage }) => {
    await normalUserAuth.login();
    if (!ownedPostSetup.postId) {
      throw new Error('Set E2E_OWNED_POST_ID to run empty-comment validation against a seeded post.');
    }
    await postDetailPage.goToPost(ownedPostSetup.postId);
    await postDetailPage.submitComment();
    await postDetailPage.expectEmptyCommentValidation();
  });
});
