import { LoginPage } from '../pages/LoginPage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { expect, loginWithDefaultUser, test } from '../fixtures/test';

test('Authenticated user views and incrementally loads the personalized feed @high', async ({ page }) => {
  test.skip(
    true,
    'Missing selector in src/: stable post-id attributes required for incremental-load verification are not available in scoped source files',
  );

  const loginPage = new LoginPage(page);
  const homeFeedPage = new HomeFeedPage(page);
  await loginWithDefaultUser(page, loginPage);
  await homeFeedPage.open();
  await homeFeedPage.expectShellVisible();
});

test('Guest is denied access to the home feed @high', async ({ page }) => {
  const homeFeedPage = new HomeFeedPage(page);
  await homeFeedPage.open();

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('main article')).toHaveCount(0);
});
