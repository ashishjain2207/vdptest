import { test } from '../fixtures/auth';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { loadTestData } from '../utils/testData';

type ReportedPostData = {
  reportedPostText: string;
};

type UserAccountData = {
  userIdentifier: string;
};

const reportedPostData = loadTestData<ReportedPostData>('reportedPostData.json');
const userAccountData = loadTestData<UserAccountData>('userAccountData.json');

test.describe('admin panel', () => {
  test('Admin user removes inappropriate post', async ({ page, adminUserAuth }) => {
    const adminPanelPage = new AdminPanelPage(page);

    await adminUserAuth();
    test.skip(!page.url().includes('/admin'), 'Admin account is required for this scenario.');

    await adminPanelPage.openReportedPosts();
    await adminPanelPage.removeReportedPost(reportedPostData.reportedPostText);
    await adminPanelPage.expectPostRemoved(reportedPostData.reportedPostText);
  });

  test('Admin user suspends and reactivates a user account', async ({ page, adminUserAuth }) => {
    const adminPanelPage = new AdminPanelPage(page);

    await adminUserAuth();
    test.skip(!page.url().includes('/admin'), 'Admin account is required for this scenario.');

    await adminPanelPage.openUserManagement();
    await adminPanelPage.searchUser(userAccountData.userIdentifier);
    await adminPanelPage.suspendUser();
    await adminPanelPage.expectUserStatus('suspended');
    await adminPanelPage.reactivateUser();
    await adminPanelPage.expectUserStatus('active');
  });
});
