import { test as base } from '@playwright/test';
import type { AuthenticatedSession } from '../utils/seed';
import { getE2EConfig, type RoleCredentials } from '../utils/env';
import { createRoleSession, ensureStorageStateForRole } from '../utils/seed';
import { storageStatePaths } from './storageState';

export interface GuestFixture {
  role: 'guest';
}

export interface RoleAuthFixture {
  credentials: RoleCredentials;
  storageStatePath: string;
  createSession: () => Promise<AuthenticatedSession>;
}

type AuthFixtures = {
  guestUser: GuestFixture;
  normalUserAuth: RoleAuthFixture;
  adminUserAuth: RoleAuthFixture;
};

type InternalFixtures = {
  preparedRoleStorageStates: void;
};

function buildRoleFixture(
  credentials: RoleCredentials,
  storageStatePath: string,
): RoleAuthFixture {
  return {
    credentials,
    storageStatePath,
    createSession: () => createRoleSession(credentials),
  };
}

export const authTest = base.extend<AuthFixtures, InternalFixtures>({
  preparedRoleStorageStates: [
    async ({ browser }, use) => {
      const config = getE2EConfig();
      await ensureStorageStateForRole(browser, config.normalUser, storageStatePaths.normalUser);
      await ensureStorageStateForRole(browser, config.adminUser, storageStatePaths.adminUser);
      await use();
    },
    { scope: 'worker', auto: true },
  ],

  guestUser: async ({ preparedRoleStorageStates }, use) => {
    void preparedRoleStorageStates;
    await use({ role: 'guest' });
  },

  normalUserAuth: async ({ preparedRoleStorageStates }, use) => {
    void preparedRoleStorageStates;
    const config = getE2EConfig();
    await use(buildRoleFixture(config.normalUser, storageStatePaths.normalUser));
  },

  adminUserAuth: async ({ preparedRoleStorageStates }, use) => {
    void preparedRoleStorageStates;
    const config = getE2EConfig();
    await use(buildRoleFixture(config.adminUser, storageStatePaths.adminUser));
  },
});
