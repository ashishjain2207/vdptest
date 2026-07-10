import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  normalUserAuth: () => Promise<void>;
  adminUserAuth: () => Promise<void>;
  guestUser: () => Promise<void>;
};

function requireEnv(name: 'E2E_USER_EMAIL' | 'E2E_USER_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const test = base.extend<AuthFixtures>({
  normalUserAuth: async ({ page, context }, use) => {
    await use(async () => {
      await context.clearCookies();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(requireEnv('E2E_USER_EMAIL'), requireEnv('E2E_USER_PASSWORD'));
      await expect(page).toHaveURL(/\/(posts|onboarding|profile\/.+|admin)/);
    });
  },
  adminUserAuth: async ({ page, normalUserAuth }, use) => {
    await use(async () => {
      await normalUserAuth();
      await page.goto('/admin');
    });
  },
  guestUser: async ({ context }, use) => {
    await use(async () => {
      await context.clearCookies();
    });
  },
});

export { expect } from '@playwright/test';
