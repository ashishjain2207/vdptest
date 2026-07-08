import { test } from '../fixtures/test';
import { ensureModerationTargetUser, ensureReportedPost } from '../utils/seed';
import reportedPostData from '../test-data/admin/reportedPostData.json';
import userAccountData from '../test-data/admin/userAccountData.json';

test.describe.configure({ mode: 'serial' });

test.describe('admin panel', () => {
  test('Admin user removes inappropriate post', async ({ request, adminUserAuth, adminPanelPage }) => {
    const reportedPost = await ensureReportedPost(request, reportedPostData.text);

    await adminUserAuth.signIn();
    await adminPanelPage.gotoReportedPosts();
    await adminPanelPage.removeReportedPost(reportedPost.text);

    await adminPanelPage.expectReportedPostRemoved(reportedPost.text);
  });

  test('Admin user suspends and reactivates a user account', async ({
    request,
    adminUserAuth,
    adminPanelPage,
  }) => {
    const targetUser = await ensureModerationTargetUser(request);
    const username = targetUser.username || userAccountData.username;

    await adminUserAuth.signIn();
    await adminPanelPage.gotoUserManagement();
    await adminPanelPage.suspendUser(username);
    await adminPanelPage.expectUserSuspended(username);
    await adminPanelPage.reactivateUser(username);

    await adminPanelPage.expectUserActive(username);
  });
});
