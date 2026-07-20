import { test, expect } from '../fixtures/test';
import { getRoleMissingReason } from '../utils/env';

test.describe('admin panel', () => {
  test.fixme(
    'Admin user removes inappropriate post',
    'The current admin content-moderation UI exposes resolve and dismiss actions, but not a deterministic explicit remove/delete-post control for the approved scenario.',
  );

  test('Admin user suspends and reactivates a user account', async ({ auth, env, adminPanelPage, page }) => {
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
    await expect(page.getByTestId('admin-user-suspend-toggle')).toBeVisible();
    await page.getByTestId('admin-user-suspend-toggle').click();

    await expect.poll(async () => (await row.textContent()) ?? '').toMatch(/Suspended|Gesperrt/i);

    await adminPanelPage.openUserActions(row);
    await page.getByTestId('admin-user-suspend-toggle').click();
    await expect.poll(async () => (await row.textContent()) ?? '').toMatch(/Active|Aktiv/i);
  });
});
