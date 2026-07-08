import fs from 'node:fs';
import path from 'node:path';
import { expect, Page } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import {
  LoginCredentials,
  requireAdminUserCredentials,
  requireNormalUserCredentials,
} from '../utils/env';
import { AuthRole, storageStatePathForRole } from './storageState';

export type RoleAuthFixture = {
  role: AuthRole;
  page: Page;
  credentials: LoginCredentials;
  storageStatePath: string;
  signIn: () => Promise<void>;
};

export type GuestUserFixture = {
  page: Page;
  signOut: () => Promise<void>;
};

export type AuthFixtures = {
  normalUserAuth: RoleAuthFixture;
  adminUserAuth: RoleAuthFixture;
  guestUser: GuestUserFixture;
};

async function clearBrowserSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

function buildRoleFixture(
  role: AuthRole,
  page: Page,
  credentials: LoginCredentials,
): RoleAuthFixture {
  const storageStatePath = storageStatePathForRole(role);

  return {
    role,
    page,
    credentials,
    storageStatePath,
    signIn: async () => {
      const loginPage = new LoginPage(page);

      await loginPage.login(credentials);
      await expect(page).toHaveURL(/\/posts|\/onboarding|\/$/);

      fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
      await page.context().storageState({ path: storageStatePath });
    },
  };
}

export const authFixtures = {
  normalUserAuth: async ({ page }, use) => {
    await use(buildRoleFixture('normal-user', page, requireNormalUserCredentials()));
  },
  adminUserAuth: async ({ page }, use) => {
    await use(buildRoleFixture('admin-user', page, requireAdminUserCredentials()));
  },
  guestUser: async ({ page }, use) => {
    const guest = {
      page,
      signOut: async () => clearBrowserSession(page),
    };

    await guest.signOut();
    await use(guest);
  },
};
