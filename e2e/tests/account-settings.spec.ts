import { AccountSettingsPage } from '../pages/AccountSettingsPage';
import { LoginPage } from '../pages/LoginPage';
import { expect, loginWithDefaultUser, test } from '../fixtures/test';

test('User accesses account and privacy settings and logs out @high', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const accountSettingsPage = new AccountSettingsPage(page);

  await loginWithDefaultUser(page, loginPage);

  await accountSettingsPage.open();
  await accountSettingsPage.expectVisible();
  await expect(page).toHaveURL(/\/settings\/account(?:\?|$)/);

  await accountSettingsPage.profileNavLink.click();
  await expect(page).toHaveURL(/\/settings\/profile(?:\?|$)/);

  await accountSettingsPage.accountNavLink.click();
  await expect(page).toHaveURL(/\/settings\/account(?:\?|$)/);

  await accountSettingsPage.logoutButton.click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);

  await page.goto('/posts');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);

  await page.goto('/settings/account');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});
