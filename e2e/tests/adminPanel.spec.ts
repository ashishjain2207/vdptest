import { test, expect } from '../fixtures/test';
import { getRoleMissingReason } from '../utils/env';

test.describe('admin panel', () => {
  test('loads admin users and exposes row actions for a known target user', async ({ auth, env, adminPanelPage, page }) => {
    test.skip(!env.admin.isConfigured, getRoleMissingReason(env, 'admin'));

    const targetHandle = env.adminSuspendTargetHandle || env.targetUserHandle;
    const targetUserId = env.adminSuspendTargetUserId;
    test.skip(!targetHandle && !targetUserId, 'Requires a target handle or user ID to locate an admin row.');

    await auth.loginAsAdminUser('/admin/users');
    await adminPanelPage.expectUsersLoaded();

    let row = targetUserId ? adminPanelPage.userRowById(targetUserId) : page.locator('body');
    if (targetHandle) {
      await adminPanelPage.searchUsers(targetHandle);
      row = targetUserId ? adminPanelPage.userRowById(targetUserId) : adminPanelPage.userRowByHandle(targetHandle);
    }

    await expect(row).toBeVisible();
    await adminPanelPage.openUserActions(row);
    await expect(page.getByTestId('admin-user-change-role')).toBeVisible();
    await expect(page.getByTestId('admin-user-suspend-toggle')).toBeVisible();
  });

  test('loads admin content moderation and opens the first case when the queue is not empty', async ({ auth, env, adminPanelPage, page }) => {
    test.skip(!env.admin.isConfigured, getRoleMissingReason(env, 'admin'));

    await auth.loginAsAdminUser('/admin/content-moderation');
    await adminPanelPage.expectModerationLoaded();

    const itemCount = await adminPanelPage.moderationItems().count();
    if (itemCount === 0) {
      return;
    }

    await adminPanelPage.openFirstModerationItem();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
