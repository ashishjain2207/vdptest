import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildDeletePostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { createPostViaApi, extractId } from '../utils/seed';

test.describe('delete post', () => {
  test('User deletes own post with confirmation', async ({ auth, env, request, homeFeedPage, postDetailPage, createPostPage }) => {
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

      await expect(postDetailPage.page).not.toHaveURL(new RegExp(`/posts/${postId}$`));
      await homeFeedPage.goto();
      await expect(homeFeedPage.postCard(postId)).toHaveCount(0);
    } finally {
      await cleanup.run(request);
    }
  });

  test('User cannot delete another user\'s post', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const seeded = await createPostViaApi(request, 'secondary', buildDeletePostData().content);
    const postId = extractId(seeded, 'id', 'Id');
    cleanup.trackPost('secondary', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();
      await postDetailPage.openActions();

      await expect(postDetailPage.deleteAction).toHaveCount(0);
    } finally {
      await cleanup.run(request);
    }
  });
});
