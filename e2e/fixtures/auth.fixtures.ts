import type { Page, TestInfo } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getE2EConfig, type E2EConfig } from '../utils/env';
import { hasStorageState, storageStatePath, type AuthRole } from './storageState';

export type RoleAuth = {
  role: AuthRole;
  credentials: E2EConfig['normalUser'];
  page: Page;
  storageStatePath: string;
  signIn: () => Promise<void>;
};

export type GuestUser = {
  role: 'guest';
  page: Page;
  reset: () => Promise<void>;
};

async function clearBrowserState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

function credentialsForRole(role: AuthRole): E2EConfig['normalUser'] {
  const config = getE2EConfig();
  return role === 'adminUser' ? config.adminUser : config.normalUser;
}

export async function createRoleAuth(page: Page, role: AuthRole, testInfo: TestInfo): Promise<RoleAuth> {
  const config = getE2EConfig();
  const credentials = credentialsForRole(role);
  const statePath = storageStatePath(role);

  return {
    role,
    credentials,
    page,
    storageStatePath: statePath,
    signIn: async () => {
      if (config.reuseStorageState && hasStorageState(role)) {
        await page.context().addCookies([]);
      }

      await clearBrowserState(page);
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(credentials.email || credentials.username || '', credentials.password);
      await loginPage.expectSuccessfulLogin();
      await page.context().storageState({ path: statePath });
      testInfo.attachments.push({
        name: `${role}-storage-state`,
        contentType: 'application/json',
        path: statePath,
      });
    },
  };
}

export async function createGuestUser(page: Page): Promise<GuestUser> {
  return {
    role: 'guest',
    page,
    reset: async () => {
      await clearBrowserState(page);
    },
  };
}
