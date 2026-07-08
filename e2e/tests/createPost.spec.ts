import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildCreatePostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';

test.describe('create post', () => {
  test('creates a text-only post from the feed composer', async ({ auth, env, request, homeFeedPage, createPostPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const cleanup = new CleanupRegistry();

    try {
      await auth.loginAsPrimaryUser('/posts');
      await homeFeedPage.expectLoaded();
      await createPostPage.expectComposerVisible();

      const post = buildCreatePostData();
      await createPostPage.createTextPost(post.content);

      const card = homeFeedPage.postCardByText(post.content);
      await expect(card).toBeVisible();

      const postId = await card.getAttribute('data-post-id');
      if (postId) {
        cleanup.trackPost('user', postId);
      }
    } finally {
      await cleanup.run(request);
    }
  });

  test.fixme(
    'shows moderation feedback for blocked content',
    'This requires deterministic moderation rules or a seeded moderation response in the target environment.',
  );
});
