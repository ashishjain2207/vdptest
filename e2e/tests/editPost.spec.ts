import { test, expect } from '../fixtures/test';
import { CleanupRegistry } from '../utils/cleanup';
import { buildEditPostData } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';
import { createPostViaApi, extractId, getOwnProfile } from '../utils/seed';

test.describe('edit post', () => {
  test('User edits own post successfully', async ({ auth, env, request, userProfilePage, createPostPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const cleanup = new CleanupRegistry();
    const postData = buildEditPostData();
    const seeded = await createPostViaApi(request, 'user', postData.originalContent);
    const postId = extractId(seeded, 'id', 'Id');
    const ownProfile = await getOwnProfile(request, 'user');
    const ownProfileKey = extractId(ownProfile, 'profileSlug', 'handle', 'userId', 'UserId');
    cleanup.trackPost('user', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await userProfilePage.goto(ownProfileKey);
      await userProfilePage.expectLoaded();
      await userProfilePage.openPostsTab();
      await expect(userProfilePage.postCard(postId)).toBeVisible();

      await userProfilePage.postCard(postId).getByTestId('post-card-actions').click();
      await userProfilePage.page.getByTestId('post-card-edit').click();

      await createPostPage.fillEditModalContent(postData.updatedContent);
      await createPostPage.saveEditedPost();

      await expect(userProfilePage.postCard(postId)).toContainText(postData.updatedContent);
    } finally {
      await cleanup.run(request);
    }
  });

  test('User cannot edit another user\'s post', async ({ auth, env, request, postDetailPage }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));
    test.skip(!env.secondary.isConfigured, getRoleMissingReason(env, 'secondary'));

    const cleanup = new CleanupRegistry();
    const postData = buildEditPostData();
    const seeded = await createPostViaApi(request, 'secondary', postData.originalContent);
    const postId = extractId(seeded, 'id', 'Id');
    cleanup.trackPost('secondary', postId);

    try {
      await auth.loginAsPrimaryUser('/posts');
      await postDetailPage.goto(postId);
      await postDetailPage.expectLoaded();
      await postDetailPage.openActions();

      await expect(postDetailPage.editAction).toHaveCount(0);
    } finally {
      await cleanup.run(request);
    }
  });
});
