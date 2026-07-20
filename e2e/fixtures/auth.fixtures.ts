import { test as base, type APIRequestContext, type Page } from '@playwright/test';

import { getEnv, getRoleConfig, getRoleMissingReason, type AuthRole, type E2EEnv } from '../utils/env';
import { clearAuthStorage, ensureStorageStateFile, hydratePageWithStorageState } from './storageState';

export interface AuthHelper {
  loginAs(role: AuthRole, landingPath?: string): Promise<void>;
  loginAsPrimaryUser(landingPath?: string): Promise<void>;
  loginAsAdminUser(landingPath?: string): Promise<void>;
  loginAsSecondaryUser(landingPath?: string): Promise<void>;
  loginAsOnboardingUser(landingPath?: string): Promise<void>;
  clear(): Promise<void>;
  ensureStorageState(role: AuthRole): Promise<string>;
}

interface AuthFixtures {
  env: E2EEnv;
  auth: AuthHelper;
  guestUser: Page;
  normalUserAuth: Page;
  adminUserAuth: Page;
}

const storageStateCache = new Map<string, string>();

function defaultLandingPath(role: AuthRole): string {
  if (role === 'admin') {
    return '/admin/users';
  }
  if (role === 'onboarding') {
    return '/onboarding';
  }
  return '/posts';
}

async function ensureState(
  request: APIRequestContext,
  role: AuthRole,
  env: E2EEnv,
): Promise<string> {
  const cacheKey = `${role}:${getRoleConfig(env, role).username}`;
  if (!storageStateCache.has(cacheKey)) {
    storageStateCache.set(cacheKey, await ensureStorageStateFile(request, role, env));
  }
  return storageStateCache.get(cacheKey)!;
}

async function loginWithRole(
  page: Page,
  request: APIRequestContext,
  role: AuthRole,
  env: E2EEnv,
  landingPath?: string,
): Promise<void> {
  const config = getRoleConfig(env, role);
  if (!config.isConfigured) {
    throw new Error(getRoleMissingReason(env, role));
  }
  const statePath = await ensureState(request, role, env);
  await hydratePageWithStorageState(page, statePath, env);
  await page.goto(new URL(landingPath ?? defaultLandingPath(role), `${env.baseURL}/`).toString(), {
    waitUntil: 'domcontentloaded',
  });
}

export const test = base.extend<AuthFixtures>({
  env: [
    async ({}, use) => {
      await use(getEnv());
    },
    { scope: 'worker' },
  ],
  auth: async ({ page, request, env }, use) => {
    const helper: AuthHelper = {
      loginAs: (role, landingPath) => loginWithRole(page, request, role, env, landingPath),
      loginAsPrimaryUser: (landingPath) => loginWithRole(page, request, 'user', env, landingPath),
      loginAsAdminUser: (landingPath) => loginWithRole(page, request, 'admin', env, landingPath),
      loginAsSecondaryUser: (landingPath) => loginWithRole(page, request, 'secondary', env, landingPath),
      loginAsOnboardingUser: (landingPath) => loginWithRole(page, request, 'onboarding', env, landingPath),
      clear: () => clearAuthStorage(page, env),
      ensureStorageState: (role) => ensureState(request, role, env),
    };

    await use(helper);
  },
  guestUser: async ({ page, auth }, use) => {
    await auth.clear();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await use(page);
  },
  normalUserAuth: async ({ page, auth, env }, use) => {
    if (env.user.isConfigured) {
      await auth.loginAsPrimaryUser('/posts');
    }
    await use(page);
  },
  adminUserAuth: async ({ page, auth, env }, use) => {
    if (env.admin.isConfigured) {
      await auth.loginAsAdminUser('/admin/users');
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
