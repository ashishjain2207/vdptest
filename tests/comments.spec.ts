import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueComment } from '../utils/randomData';

type CommentData = {
  commentPrefix: string;
};

test.describe('comments', () => {
  test.beforeEach(async ({ homeFeedPage, createPostPage, userProfilePage, normalUserAuth, ownedPostSetup }) => {
    test.skip(!normalUserAuth.userId && !normalUserAuth.username, 'Set normal user profile identifiers for post-detail navigation.');

    await homeFeedPage.open();
    await createPostPage.createTextPost(ownedPostSetup.content);
    await userProfilePage.openProfile(normalUserAuth.userId || normalUserAuth.username);
    await userProfilePage.openPost(ownedPostSetup.content);
  });

  test('Add Comment to Post with Valid Text', async ({ postDetailPage }) => {
    const data = loadTestData<CommentData>('validComment.json');
    const comment = uniqueComment(data.commentPrefix);

    await postDetailPage.addComment(comment);
  });

  test('Add Empty Comment Should Fail', async ({ postDetailPage }) => {
    await postDetailPage.submitEmptyComment();
    await postDetailPage.expectEmptyCommentValidation();
  });
});
