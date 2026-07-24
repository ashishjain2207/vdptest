import { expect, test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login-page';

type E2EFixtures = {
  userEmail: string;
  userPassword: string;
};

function requireEnv(name: 'E2E_USER_EMAIL' | 'E2E_USER_PASSWORD'): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required for authenticated E2E runs.`);
  }
  return value;
}

export const test = base.extend<E2EFixtures>({
  userEmail: [async ({}, use) => use(requireEnv('E2E_USER_EMAIL')), { scope: 'worker' }],
  userPassword: [async ({}, use) => use(requireEnv('E2E_USER_PASSWORD')), { scope: 'worker' }],
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('vdpconnect_language', 'EN');
    });
    await use(page);
  },
});

export async function loginAsAuthenticatedUser(
  page: Page,
  userEmail: string,
  userPassword: string,
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(userEmail, userPassword);
  await expect(page).toHaveURL(/\/posts(?:[/?#].*)?$/);
}

export { expect };
