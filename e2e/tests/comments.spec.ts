import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';
import { runtimeCommentText, seededCommentText, seededPostId } from '../utils/seed';

const validCommentData = readTestData<{ postIdEnv: string; textTemplate: string }>('test-data/comments/validCommentData.json');
const emptyCommentData = readTestData<{ postIdEnv: string; expectedErrorPattern: string }>('test-data/comments/emptyCommentData.json');
const deleteCommentData = readTestData<{
  postIdEnv: string;
  textTemplate: string;
  otherCommentTextEnv: string;
  otherCommentText: string;
}>('test-data/comments/deleteCommentData.json');

test.describe('comments', () => {
  test('user adds a valid comment to a post', async ({ normalUserAuth, postDetailPage }) => {
    const commentText = runtimeCommentText(validCommentData);

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(seededPostId(validCommentData.postIdEnv));
    await postDetailPage.addComment(commentText);
    await postDetailPage.expectCommentVisible(commentText);
    await postDetailPage.expectCommentCountChanged();
  });

  test('comment submission fails with empty text', async ({ normalUserAuth, postDetailPage }) => {
    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(seededPostId(emptyCommentData.postIdEnv));
    await postDetailPage.expectEmptyCommentBlocked();
  });

  test('user deletes own comment', async ({ normalUserAuth, postDetailPage }) => {
    const commentText = runtimeCommentText(deleteCommentData);

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(seededPostId(deleteCommentData.postIdEnv));
    await postDetailPage.addComment(commentText);
    await postDetailPage.expectCommentVisible(commentText);
    await postDetailPage.deleteOwnComment(commentText);
    await postDetailPage.expectCommentRemoved(commentText);
  });

  test('user cannot delete another user comment unless admin', async ({ normalUserAuth, postDetailPage }) => {
    const otherCommentText = seededCommentText(deleteCommentData.otherCommentTextEnv, deleteCommentData.otherCommentText);

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(seededPostId(deleteCommentData.postIdEnv));
    await postDetailPage.expectDeleteUnavailableForComment(otherCommentText);
  });
});
