import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildCreatePostData, getEmptyPostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { UPLOAD_FIXTURES } from '../utils/uploadFiles';

test.describe('create post', () => {
  test('User creates a valid text post', async ({ auth, env, request, homeFeedPage, createPostPage }) => {
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

  test('Post creation fails with empty text and no media', async ({ auth, env, createPostPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const emptyPost = getEmptyPostData();

    await auth.loginAsPrimaryUser('/posts');
    await createPostPage.expectComposerVisible();
    await createPostPage.fillContent(emptyPost.content);

    await expect(createPostPage.submitButton).toBeDisabled();
    await expect(createPostPage.page).toHaveURL(/\/posts$/);
  });

  test('User uploads unsupported media file type in post', async ({ auth, env, createPostPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    await auth.loginAsPrimaryUser('/posts');
    await createPostPage.expectComposerVisible();
    await createPostPage.attachFile(UPLOAD_FIXTURES.unsupportedMedia);

    await expect(createPostPage.submitButton).toBeDisabled();
    await expect(createPostPage.page).toHaveURL(/\/posts$/);
  });
});
