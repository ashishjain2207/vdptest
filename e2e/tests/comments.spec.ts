import { expect, test } from '../fixtures/test';
import { uniqueCommentText } from '../utils/dataFactory';
import {
  ensureCommentPost,
  ensureOtherUserComment,
  ensureOwnComment,
} from '../utils/seed';
import validCommentData from '../test-data/comments/validCommentData.json';
import emptyCommentData from '../test-data/comments/emptyCommentData.json';
import deleteCommentData from '../test-data/comments/deleteCommentData.json';

test.describe('comments', () => {
  test('User adds a valid comment to a post', async ({ request, normalUserAuth, postDetailPage }) => {
    const postId = await ensureCommentPost(request);
    const commentText = uniqueCommentText(validCommentData.textPrefix);

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(postId);
    const initialCommentCount = await postDetailPage.commentCount.textContent().catch(() => null);
    await postDetailPage.addComment(commentText);

    await postDetailPage.expectCommentVisible(commentText);
    if (initialCommentCount) {
      await expect(postDetailPage.commentCount).not.toHaveText(initialCommentCount);
    }
  });

  test('Comment submission fails with empty text', async ({ request, normalUserAuth, postDetailPage }) => {
    const postId = await ensureCommentPost(request);

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(postId);
    await postDetailPage.submitEmptyComment();

    await postDetailPage.expectEmptyCommentValidation();
    await expect(postDetailPage.commentInput).toBeVisible();
    await expect(postDetailPage.commentValidationError).toContainText(new RegExp(emptyCommentData.expectedError, 'i'));
  });

  test('User deletes own comment', async ({ request, normalUserAuth, postDetailPage }) => {
    const ownComment = await ensureOwnComment(request, deleteCommentData.text);

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(ownComment.postId);
    const initialCommentCount = await postDetailPage.commentCount.textContent().catch(() => null);
    await postDetailPage.deleteComment(ownComment.text);

    await postDetailPage.expectCommentRemoved(ownComment.text);
    if (initialCommentCount) {
      await expect(postDetailPage.commentCount).not.toHaveText(initialCommentCount);
    }
  });

  test("User cannot delete another user's comment unless admin", async ({
    request,
    normalUserAuth,
    postDetailPage,
  }) => {
    const otherComment = await ensureOtherUserComment(
      request,
      'Seeded other-user comment for delete permission',
    );

    await normalUserAuth.signIn();
    await postDetailPage.gotoPost(otherComment.postId);

    await postDetailPage.expectCommentVisible(otherComment.text);
    await postDetailPage.expectCannotDeleteComment(otherComment.text);
  });
});
