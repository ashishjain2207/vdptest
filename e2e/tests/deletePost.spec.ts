import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildDeletePostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { createPostViaApi, extractId } from '../utils/seed';

test.describe('delete post', () => {
  test('deletes a seeded post from the post detail actions', async ({ auth, env, request, homeFeedPage, postDetailPage, createPostPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const cleanup = new CleanupRegistry();
    const seeded = await createPostViaApi(request, 'user', buildDeletePostData().content);
    const postId = extractId(seeded, 'id', 'Id');
    cleanup.trackPost('user', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await homeFeedPage.goto();
      await homeFeedPage.waitForPostCard(postId);

      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();
      await postDetailPage.openDelete();
      await createPostPage.confirmDelete();

      await expect(postDetailPage.page).toHaveURL(/\/posts$/);
      await expect(homeFeedPage.postCard(postId)).toHaveCount(0);
      await cleanup.run(request);
    } finally {
      await cleanup.run(request);
    }
  });
});
