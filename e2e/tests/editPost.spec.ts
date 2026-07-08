import { expect, test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { createCleanupManager } from '../utils/cleanup';
import { createRuntimeTemplateTokens, interpolateFixtureData } from '../utils/dataFactory';
import { getE2EConfig } from '../utils/env';
import { createRoleSession, createTextPost, readJsonFixture } from '../utils/seed';

test.describe('edit post', () => {
  test.use({ storageState: storageStatePaths.normalUser });

  test('User edits own post successfully', async ({ normalUserAuth, userProfilePage, postDetailPage, page }) => {
    const cleanup = createCleanupManager();
    const session = await normalUserAuth.createSession();

    try {
      const postData = interpolateFixtureData(
        readJsonFixture<{ originalContent: string; updatedContent: string }>('e2e/test-data/posts/editPostData.json'),
        createRuntimeTemplateTokens('edit-post'),
      );
      const createdPost = await createTextPost(session, postData.originalContent);
      cleanup.trackPost(String(createdPost.id ?? ''));

      await userProfilePage.goto(normalUserAuth.credentials.handle ?? session.userId);
      await userProfilePage.openPostByText(postData.originalContent);
      await postDetailPage.expectLoaded();
      await postDetailPage.openActionsMenu();
      await page.getByTestId('post-detail-edit-action').click();

      const dialog = page.getByRole('dialog');
      await dialog.locator('textarea').first().fill(postData.updatedContent);
      await dialog.getByRole('button', { name: /save|speichern/i }).click();

      await expect(page.locator('body')).toContainText(postData.updatedContent);
    } finally {
      await cleanup.run({ normalUserSession: session });
      await session.dispose();
    }
  });

  test('User cannot edit another user\'s post', async ({ userProfilePage }) => {
    const otherUserSession = await createRoleSession(getE2EConfig().secondaryUser);

    try {
      const postText = `Secondary user post ${Date.now()}`;
      const createdPost = await createTextPost(otherUserSession, postText);

      await userProfilePage.goto(getE2EConfig().secondaryUser.handle ?? otherUserSession.userId);
      await userProfilePage.expectPostActionHidden(postText, 'post-edit-action');

      await otherUserSession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${String(createdPost.id ?? '')}`).catch(() => undefined);
    } finally {
      await otherUserSession.dispose();
    }
  });
});
