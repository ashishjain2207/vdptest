import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

type ReportedPostData = {
  expectedConfirmation: string;
};

test.describe('Admin moderation', () => {
  test('Admin Removes Reported Inappropriate Post', async ({
    adminUserAuth,
    reportedPostSetup,
    adminPanelPage,
    reportedPostsPage,
  }) => {
    const data = loadTestData<ReportedPostData>('test-data/reportedPost.json');
    void data;

    await adminUserAuth.login();
    await adminPanelPage.goTo();
    await adminPanelPage.openReportedPosts();
    await reportedPostsPage.removeReportedPost(reportedPostSetup.content);
    await reportedPostsPage.expectReportedPostRemoved(reportedPostSetup.content);
  });
});
