import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildCommentCreateData, buildDeleteCommentData, getEmptyCommentData, buildSeedPostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { createCommentViaApi, createPostViaApi, extractId } from '../utils/seed';

test.describe('comments', () => {
  test('User adds a valid comment to a post', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const seededPost = await createPostViaApi(request, 'secondary', buildSeedPostData().content);
    const postId = extractId(seededPost, 'id', 'Id');
    cleanup.trackPost('secondary', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();

      const comment = buildCommentCreateData();
      await postDetailPage.addComment(comment.content);

      const item = postDetailPage.commentItemByText(comment.content);
      await expect(item).toBeVisible();

      const commentId = await item.getAttribute('data-comment-id');
      if (commentId) {
        cleanup.trackComment('user', commentId);
      }
    } finally {
      await cleanup.run(request);
    }
  });

  test('Comment submission fails with empty text', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const seededPost = await createPostViaApi(request, 'secondary', buildSeedPostData().content);
    const postId = extractId(seededPost, 'id', 'Id');
    const emptyComment = getEmptyCommentData();
    cleanup.trackPost('secondary', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();
      await postDetailPage.commentInput.fill(emptyComment.content);

      await expect(postDetailPage.commentSubmitButton).toBeDisabled();
    } finally {
      await cleanup.run(request);
    }
  });

  test('User deletes own comment', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const seededPost = await createPostViaApi(request, 'secondary', buildSeedPostData().content);
    const postId = extractId(seededPost, 'id', 'Id');
    const seededComment = await createCommentViaApi(request, 'user', postId, buildDeleteCommentData().content);
    const commentId = extractId(seededComment, 'id', 'Id');
    cleanup.trackPost('secondary', postId);
    cleanup.trackComment('user', commentId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();
      await expect(postDetailPage.commentItem(commentId)).toBeVisible();

      await postDetailPage.deleteComment(commentId);
      await expect(postDetailPage.commentItem(commentId)).toHaveCount(0);
    } finally {
      await cleanup.run(request);
    }
  });

  test('User cannot delete another user\'s comment unless admin', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const seededPost = await createPostViaApi(request, 'secondary', buildSeedPostData().content);
    const postId = extractId(seededPost, 'id', 'Id');
    const seededComment = await createCommentViaApi(request, 'secondary', postId, buildDeleteCommentData().content);
    const commentId = extractId(seededComment, 'id', 'Id');
    cleanup.trackPost('secondary', postId);
    cleanup.trackComment('secondary', commentId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();

      const commentItem = postDetailPage.commentItem(commentId);
      await expect(commentItem).toBeVisible();
      await expect(commentItem.getByTestId('comment-actions')).toHaveCount(0);
      await expect(commentItem.getByTestId('comment-delete')).toHaveCount(0);
    } finally {
      await cleanup.run(request);
    }
  });
});
