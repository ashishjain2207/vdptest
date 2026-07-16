import { LoginPage } from '../pages/LoginPage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { expect, loginWithDefaultUser, test } from '../fixtures/test';

test('Authenticated user views and incrementally loads the personalized feed @high', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homeFeedPage = new HomeFeedPage(page);
  await loginWithDefaultUser(page, loginPage);
  await homeFeedPage.open();
  await homeFeedPage.expectShellVisible();
  await expect(page.getByTestId('header-global-search')).toBeVisible();
  await expect(page.getByLabel(/create post/i)).toBeVisible();

  const feedArticles = page.locator('main article');
  const emptyFeedState = page.getByText(/no posts yet\. create your first post above\./i);
  await expect
    .poll(async () => (await feedArticles.count()) > 0 || (await emptyFeedState.count()) > 0)
    .toBeTruthy();
});

test('Guest is denied access to the home feed @high', async ({ page }) => {
  const homeFeedPage = new HomeFeedPage(page);
  await homeFeedPage.open();

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('main article')).toHaveCount(0);
});
