import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';
import { optionalEnv } from '../utils/env';
import { seededAdminUserSearch } from '../utils/seed';

const reportedPostData = readTestData<{
  contentPreviewEnv: string;
  contentPreview: string;
}>('test-data/admin/reportedPostData.json');
const userAccountData = readTestData<{
  searchEnv: string;
  searchFallback: string;
}>('test-data/admin/userAccountData.json');

test.describe('admin panel', () => {
  test('admin user removes inappropriate post', async ({ adminUserAuth, adminPanelPage }) => {
    const contentPreview = optionalEnv(reportedPostData.contentPreviewEnv) ?? reportedPostData.contentPreview;

    await adminUserAuth.signIn();
    await adminPanelPage.gotoReportedPosts();
    await adminPanelPage.removeReportedPost(contentPreview);
    await adminPanelPage.expectModerationSuccess();
  });

  test('admin user suspends and reactivates a user account', async ({ adminUserAuth, adminPanelPage }) => {
    const userSearch = seededAdminUserSearch(optionalEnv(userAccountData.searchEnv) ?? userAccountData.searchFallback);

    await adminUserAuth.signIn();
    await adminPanelPage.gotoUserManagement();
    await adminPanelPage.searchUser(userSearch);
    await adminPanelPage.suspendUser(userSearch);
    await adminPanelPage.expectUserSuspended(userSearch);
    await adminPanelPage.reactivateUser(userSearch);
    await adminPanelPage.expectUserActive(userSearch);
  });
});
