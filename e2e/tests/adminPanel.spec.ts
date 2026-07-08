import { test } from '../fixtures/test';
import { getAdminTargetUserSeed, getModerationCaseSeed } from '../utils/seed';

test.describe('e2e/tests/adminPanel.spec.ts', () => {
  test('Admin user removes inappropriate post', async ({ adminUserAuth, makePages }) => {
    const { adminPanelPage } = makePages(adminUserAuth.page);
    const seed = getModerationCaseSeed();

    await adminPanelPage.gotoModeration();
    if (seed.caseId) {
      await adminPanelPage.openModerationCaseById(seed.caseId);
    } else if (seed.casePreview) {
      await adminPanelPage.openModerationCaseByPreview(seed.casePreview);
    }
    await adminPanelPage.resolveOpenModerationCase();
    await adminPanelPage.expectModerationStatus(/resolved/i);
  });

  test('Admin user suspends and reactivates a user account', async ({ adminUserAuth, makePages }) => {
    const { adminPanelPage } = makePages(adminUserAuth.page);
    const seed = getAdminTargetUserSeed();

    await adminPanelPage.gotoUsers();
    await adminPanelPage.searchUser(seed.searchQuery);
    await adminPanelPage.suspendUser(seed.searchQuery);
    await adminPanelPage.expectUserStatus(seed.searchQuery, /suspended/i);
    await adminPanelPage.unsuspendUser(seed.searchQuery);
    await adminPanelPage.expectUserStatus(seed.searchQuery, /active/i);
  });
});
