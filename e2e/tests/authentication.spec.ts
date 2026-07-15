import { LoginPage } from '../pages/LoginPage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { expect, loginWithDefaultUser, test } from '../fixtures/test';

test('Registered user logs in and reaches the home feed @high', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homeFeedPage = new HomeFeedPage(page);

  await loginWithDefaultUser(page, loginPage);
  await expect(page).toHaveURL(/\/posts(?:\?|$|\/)/);
  await homeFeedPage.expectShellVisible();
});

test('Login rejects empty fields and invalid credentials @high', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();

  await loginPage.submitEmpty();
  await expect(loginPage.emailInput).toHaveAttribute('aria-describedby', 'login-email-err');
  await expect(loginPage.passwordInput).toHaveAttribute('aria-describedby', 'login-password-err');

  await loginPage.fillCredentials('not-a-real-user@example.com', 'wrong-password-123');
  await loginPage.submit();

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator('main')).toHaveCount(0);
});
