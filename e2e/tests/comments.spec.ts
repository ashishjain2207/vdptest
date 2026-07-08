import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildCommentCreateData, buildCommentEditData, buildSeedPostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { createPostViaApi, extractId } from '../utils/seed';

test.describe('comments', () => {
  test('creates, edits, and deletes a comment from post detail', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const seeded = await createPostViaApi(request, 'secondary', buildSeedPostData().content);
    const postId = extractId(seeded, 'id', 'Id');
    cleanup.trackPost('secondary', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();

      const created = buildCommentCreateData();
      await postDetailPage.addComment(created.content);

      const createdItem = postDetailPage.commentItemByText(created.content);
      await expect(createdItem).toBeVisible();

      const commentId = await createdItem.getAttribute('data-comment-id');
      if (commentId) {
        cleanup.trackComment('user', commentId);

        const updated = buildCommentEditData();
        await postDetailPage.editComment(commentId, updated.content);
        await expect(postDetailPage.commentItem(commentId)).toContainText(updated.content);

        await postDetailPage.deleteComment(commentId);
        await expect(postDetailPage.commentItem(commentId)).toHaveCount(0);
      }
    } finally {
      await cleanup.run(request);
    }
  });
});
