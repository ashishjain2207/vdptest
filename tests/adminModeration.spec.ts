import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';

test.describe('admin moderation', () => {
  test('Admin Removes Reported Inappropriate Post', async ({
    loginPage,
    adminPanelPage,
    reportedPostsPage,
    adminUserAuth,
    reportedPostSetup,
  }) => {
    test.skip(!hasCredentials(adminUserAuth), missingCredentialsMessage('E2E_ADMIN_USER'));
    test.skip(
      !reportedPostSetup.id && !process.env.E2E_REPORTED_POST_CONTENT,
      'Set E2E_REPORTED_POST_ID or E2E_REPORTED_POST_CONTENT for moderation validation.',
    );

    await loginPage.login(adminUserAuth.email, adminUserAuth.password, '/admin/content-moderation');
    await adminPanelPage.gotoAdminModeration();
    await reportedPostsPage.removeReportedPost(reportedPostSetup.content);

    await reportedPostsPage.expectReportedPostRemoved(reportedPostSetup.content);
  });
});
