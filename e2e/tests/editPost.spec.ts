import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildEditPostData, buildSeedPostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { createPostViaApi, extractId } from '../utils/seed';

test.describe('edit post', () => {
  test('edits a seeded post from the feed card actions', async ({ auth, env, request, homeFeedPage, createPostPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const cleanup = new CleanupRegistry();
    const seeded = await createPostViaApi(request, 'user', buildSeedPostData().content);
    const postId = extractId(seeded, 'id', 'Id');
    cleanup.trackPost('user', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await homeFeedPage.goto();
      await homeFeedPage.waitForPostCard(postId);

      await homeFeedPage.openEditForPost(postId);

      const updated = buildEditPostData();
      await createPostPage.fillEditModalContent(updated.content);
      await createPostPage.saveEditedPost();

      const card = homeFeedPage.postCard(postId);
      await expect(card).toContainText(updated.content);
    } finally {
      await cleanup.run(request);
    }
  });
});
