import { test } from '../fixtures/test.fixture';

test.describe('admin moderation', () => {
  test('Admin Removes Reported Inappropriate Post', async ({
    adminUserAuth,
    adminPanelPage,
    reportedPostsPage,
    reportedPostSetup,
  }) => {
    test.info().annotations.push({ type: 'admin', description: adminUserAuth.email });

    await adminPanelPage.openContentModeration();
    await reportedPostsPage.removeReportedPost(reportedPostSetup.content);
    await reportedPostsPage.expectReportedPostRemoved(reportedPostSetup.content);
  });
});
