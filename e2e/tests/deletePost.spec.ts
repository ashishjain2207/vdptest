import { expect, test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { createCleanupManager } from '../utils/cleanup';
import { createRuntimeTemplateTokens, interpolateFixtureData } from '../utils/dataFactory';
import { getE2EConfig } from '../utils/env';
import { createRoleSession, createTextPost, readJsonFixture } from '../utils/seed';

test.describe('delete post', () => {
  test.use({ storageState: storageStatePaths.normalUser });

  test('User deletes own post with confirmation', async ({ normalUserAuth, userProfilePage, postDetailPage, page }) => {
    const cleanup = createCleanupManager();
    const session = await normalUserAuth.createSession();

    try {
      const postData = interpolateFixtureData(
        readJsonFixture<{ content: string }>('e2e/test-data/posts/deletePostData.json'),
        createRuntimeTemplateTokens('delete-post'),
      );
      const createdPost = await createTextPost(session, postData.content);
      cleanup.trackPost(String(createdPost.id ?? ''));

      await userProfilePage.goto(normalUserAuth.credentials.handle ?? session.userId);
      await userProfilePage.openPostByText(postData.content);
      await postDetailPage.expectLoaded();
      await postDetailPage.openActionsMenu();
      await page.getByTestId('post-detail-delete-action').click();
      await page.getByRole('alertdialog').getByRole('button', { name: /delete|löschen/i }).click();

      await expect(page.locator('body')).not.toContainText(postData.content);
    } finally {
      await cleanup.run({ normalUserSession: session });
      await session.dispose();
    }
  });

  test('User cannot delete another user\'s post', async ({ userProfilePage }) => {
    const otherUserSession = await createRoleSession(getE2EConfig().secondaryUser);

    try {
      const postText = `Secondary deletable post ${Date.now()}`;
      const createdPost = await createTextPost(otherUserSession, postText);

      await userProfilePage.goto(getE2EConfig().secondaryUser.handle ?? otherUserSession.userId);
      await userProfilePage.expectPostActionHidden(postText, 'post-delete-action');

      await otherUserSession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${String(createdPost.id ?? '')}`).catch(() => undefined);
    } finally {
      await otherUserSession.dispose();
    }
  });
});
