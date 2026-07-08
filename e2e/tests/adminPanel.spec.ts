import { expect, test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { getE2EConfig } from '../utils/env';
import { createRoleSession, createTextPost, listModerationCases, readJsonFixture, submitContentReport } from '../utils/seed';

test.describe('admin panel', () => {
  test.use({ storageState: storageStatePaths.adminUser });

  test('Admin user removes inappropriate post', async ({ adminUserAuth, adminPanelPage, page }) => {
    const adminSession = await adminUserAuth.createSession();
    const reporterSession = await createRoleSession(getE2EConfig().normalUser);
    const secondarySession = await createRoleSession(getE2EConfig().secondaryUser);
    const reportedPostData = readJsonFixture<{ postContent: string; reportReason: string }>('e2e/test-data/admin/reportedPostData.json');
    const postContent = `${reportedPostData.postContent} ${Date.now()}`;
    let postId = '';

    try {
      const post = await createTextPost(secondarySession, postContent);
      postId = String(post.id ?? '');
      await submitContentReport(reporterSession, 'Post', postId, reportedPostData.reportReason);

      await expect
        .poll(async () => {
          const cases = await listModerationCases(adminSession, { status: 'pending', contentType: 'post' });
          return JSON.stringify(cases);
        })
        .toContain(postContent);

      await adminPanelPage.gotoModeration();
      await adminPanelPage.openModerationCase(postContent);
      await adminPanelPage.resolveOpenModerationCase();

      await expect(page.locator('body')).toContainText(/resolved|case resolved/i);
    } finally {
      if (postId) {
        await secondarySession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${postId}`).catch(() => undefined);
      }
      await adminSession.dispose();
      await reporterSession.dispose();
      await secondarySession.dispose();
    }
  });

  test('Admin user suspends and reactivates a user account', async ({ adminPanelPage, page }) => {
    const userAccountData = readJsonFixture<{ targetHandle: string }>('e2e/test-data/admin/userAccountData.json');
    const targetHandle = userAccountData.targetHandle.replace('{{secondaryUserHandle}}', getE2EConfig().secondaryUser.handle ?? '');

    await adminPanelPage.gotoUsers();
    await adminPanelPage.searchUsers(targetHandle);
    await adminPanelPage.openUserActions(targetHandle);
    await adminPanelPage.suspensionAction().click();
    await expect(adminPanelPage.userRowByText(targetHandle)).toContainText(/suspended/i);

    await adminPanelPage.searchUsers(targetHandle);
    await adminPanelPage.openUserActions(targetHandle);
    await adminPanelPage.suspensionAction().click();
    await expect(adminPanelPage.userRowByText(targetHandle)).toContainText(/active/i);

    await expect(page.getByTestId('admin-users-page')).toBeVisible();
  });
});
