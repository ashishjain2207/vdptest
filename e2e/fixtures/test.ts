import { test as base, expect } from '@playwright/test';
import { createGuestUser, createRoleAuth, type GuestUser, type RoleAuth } from './auth.fixtures';
import { pageObjectFixtures, type PageObjectFixtures } from './page.fixtures';

type AppFixtures = PageObjectFixtures & {
  normalUserAuth: RoleAuth;
  adminUserAuth: RoleAuth;
  guestUser: GuestUser;
};

export const test = base.extend<AppFixtures>({
  ...pageObjectFixtures(),
  normalUserAuth: async ({ page }, use, testInfo) => {
    await use(await createRoleAuth(page, 'normalUser', testInfo));
  },
  adminUserAuth: async ({ page }, use, testInfo) => {
    await use(await createRoleAuth(page, 'adminUser', testInfo));
  },
  guestUser: async ({ page }, use) => {
    await use(await createGuestUser(page));
  },
});

export { expect };
