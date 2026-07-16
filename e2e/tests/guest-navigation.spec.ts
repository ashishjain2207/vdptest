import { LoginPage } from '../pages/LoginPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { PublicInformationPage } from '../pages/PublicInformationPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { expect, test } from '../fixtures/test';

test('Guest navigates the landing page and public information pages @medium', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const registrationPage = new RegistrationPage(page);
  const publicInformationPage = new PublicInformationPage(page);
  const forgotPasswordPage = new ForgotPasswordPage(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(page.locator('a[href="/signup"]')).toBeVisible();
  await expect(page.locator('a[href="/support?type=support"]')).toBeVisible();

  await page.locator('a[href="/signup"]').click();
  await expect(page).toHaveURL(/\/signup(?:\?|$)/);
  await expect(registrationPage.nameInput).toBeVisible();
  await expect(registrationPage.usernameInput).toBeVisible();
  await expect(registrationPage.homeCountryInput).toBeVisible();

  for (const path of ['/terms', '/privacy', '/cookie', '/accessibility']) {
    await publicInformationPage.open(path);
    await publicInformationPage.expectBackLinkTarget('/signup');
  }

  await loginPage.open();
  await loginPage.forgotPasswordLink.click();
  await expect(page).toHaveURL(/\/forgot-password(?:\?|$)/);
  await expect(forgotPasswordPage.emailInput).toBeVisible();

  await page.goto('/support?type=support');
  await expect(page.locator('#support-name')).toBeVisible();
  await expect(page.locator('#support-email')).toBeVisible();
  await expect(page.locator('#support-category')).toBeVisible();
  await expect(page.locator('#support-message')).toBeVisible();
});
