import fs from 'node:fs';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { env, type RoleCredentials } from '../utils/env';
import { LoginPage } from '../pages/LoginPage';
import { storageStatePathFor, type AuthRole } from './storageState';

export interface AuthSession {
  role: AuthRole | 'guest';
  page: Page;
  context: BrowserContext;
  storageStatePath?: string;
  credentials?: RoleCredentials;
}

async function ensureAuthenticatedStorageState(
  browser: Browser,
  role: AuthRole,
  credentials: RoleCredentials,
): Promise<string> {
  const storageStatePath = storageStatePathFor(role);

  if (fs.existsSync(storageStatePath)) {
    return storageStatePath;
  }

  const context = await browser.newContext({ baseURL: env.baseUrl });
  const page = await context.newPage();
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login({
    usernameOrEmail: credentials.usernameOrEmail,
    password: credentials.password,
  });
  await loginPage.expectLoggedIn();

  await context.storageState({ path: storageStatePath });
  await context.close();
  return storageStatePath;
}

async function createAuthedSession(
  browser: Browser,
  role: AuthRole,
  credentials: RoleCredentials,
): Promise<AuthSession> {
  const storageStatePath = await ensureAuthenticatedStorageState(browser, role, credentials);
  const context = await browser.newContext({
    baseURL: env.baseUrl,
    storageState: storageStatePath,
  });
  const page = await context.newPage();

  return {
    role,
    page,
    context,
    storageStatePath,
    credentials,
  };
}

export const authTest = base.extend<{
  normalUserAuth: AuthSession;
  adminUserAuth: AuthSession;
  guestUser: AuthSession;
}>({
  normalUserAuth: async ({ browser }, use) => {
    const session = await createAuthedSession(browser, 'normalUser', env.normalUser);
    await use(session);
    await session.context.close();
  },
  adminUserAuth: async ({ browser }, use) => {
    const session = await createAuthedSession(browser, 'adminUser', env.adminUser);
    await use(session);
    await session.context.close();
  },
  guestUser: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: env.baseUrl });
    const page = await context.newPage();
    await use({ role: 'guest', page, context });
    await context.close();
  },
});
