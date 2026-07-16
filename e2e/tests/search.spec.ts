import { EditProfilePage } from '../pages/EditProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { expect, loginWithDefaultUser, test } from '../fixtures/test';

test('User searches for users, posts, and hashtags @medium', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const editProfilePage = new EditProfilePage(page);

  await loginWithDefaultUser(page, loginPage);
  await editProfilePage.open();
  const existingHandle = (await editProfilePage.handleInput.inputValue()).trim();

  await page.goto('/explore');
  const headerSearch = page.getByTestId('header-global-search');
  await expect(headerSearch).toBeVisible();
  await headerSearch.fill(existingHandle);
  await headerSearch.press('Enter');

  await expect(page).toHaveURL(new RegExp(`/explore\\?q=${existingHandle}`, 'i'));
  await page.getByRole('tab', { name: /^People\b/i }).click();
  await expect(page.getByText(`@${existingHandle}`, { exact: false })).toBeVisible();

  await page.goto('/explore');
  const firstHashtagLink = page.locator('a[href^="/explore/tag/"]').first();
  await expect(firstHashtagLink).toBeVisible();
  await firstHashtagLink.click();

  await expect(page).toHaveURL(/\/explore\/tag\//);
  await expect(page.getByLabel('Explore posts results')).toBeVisible();
});
