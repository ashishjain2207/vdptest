import { test, loginAs } from '../fixtures/test.fixture';

test.describe('Admin moderation', () => {
  test('Admin Removes Reported Inappropriate Post', async ({
    page,
    adminUserAuth,
    adminPanelPage,
    reportedPostsPage,
    reportedPostSetup,
  }) => {
    const preview = reportedPostSetup.preview || reportedPostSetup.postId || '';

    await loginAs(page, adminUserAuth);
    await adminPanelPage.gotoContentModeration();
    await adminPanelPage.expectModerationQueueLoaded();
    await reportedPostsPage.resolveReportedPost(preview);
    await reportedPostsPage.expectPostRemovedFromPendingQueue(preview);
  });
});
