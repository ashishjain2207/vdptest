import { expect, Page, test as base } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';

type UserCredentials = {
  email: string;
  password: string;
};

type AuthFixtures = {
  credentials: UserCredentials;
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  credentials: [
    async ({}, use) => {
      const email = process.env.E2E_USER_EMAIL;
      const password = process.env.E2E_USER_PASSWORD;
      if (!email || !password) {
        throw new Error(
          'Missing credentials. Set E2E_USER_EMAIL and E2E_USER_PASSWORD before running tests.',
        );
      }
      await use({ email, password });
    },
    { scope: 'worker' },
  ],
  authenticatedPage: async ({ page, credentials }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('vdpconnect_language', 'EN');
    });
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/posts(?:\/)?(?:[?#].*)?$/);
    await use(page);
  },
});

export { expect };
