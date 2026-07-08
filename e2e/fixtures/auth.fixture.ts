import type { BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loadTestData } from '../utils/testDataLoader';

type LoginData = {
  identifierEnv: string;
  passwordEnv: string;
  fallbackIdentifier: string;
  fallbackPassword: string;
};

export type AuthCredentials = {
  identifier: string;
  password: string;
  userId?: string;
  handle?: string;
};

export type AuthSession = {
  credentials: AuthCredentials;
  login: () => Promise<void>;
};

export type GuestSession = {
  reset: () => Promise<void>;
};

export type AuthFixtures = {
  normalUserAuth: AuthSession;
  adminUserAuth: AuthSession;
  guestUser: GuestSession;
};

function normalCredentials(): AuthCredentials {
  const data = loadTestData<LoginData>('test-data/validLogin.json');
  return {
    identifier: process.env[data.identifierEnv] ?? data.fallbackIdentifier,
    password: process.env[data.passwordEnv] ?? data.fallbackPassword,
    userId: process.env.E2E_NORMAL_USER_ID,
    handle: process.env.E2E_NORMAL_USER_HANDLE,
  };
}

function adminCredentials(): AuthCredentials {
  return {
    identifier: process.env.E2E_ADMIN_USER_EMAIL ?? 'e2e.admin@example.com',
    password: process.env.E2E_ADMIN_USER_PASSWORD ?? 'E2eAdminPass!234',
    userId: process.env.E2E_ADMIN_USER_ID,
    handle: process.env.E2E_ADMIN_USER_HANDLE,
  };
}

async function clearBrowserSession(context: BrowserContext, page: Page): Promise<void> {
  await context.clearCookies();
  await page.goto('/login');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

function authSession(page: Page, credentials: AuthCredentials): AuthSession {
  return {
    credentials,
    login: async () => {
      const loginPage = new LoginPage(page);
      await loginPage.signIn(credentials.identifier, credentials.password);
      await page.waitForURL(/\/(posts|onboarding|admin|settings|messages|access-denied)(?:\?|$)/, {
        timeout: 30000,
      }).catch(() => undefined);
    },
  };
}

export const authFixtures = {
  normalUserAuth: async ({ page }: { page: Page }, use: (session: AuthSession) => Promise<void>) => {
    await use(authSession(page, normalCredentials()));
  },
  adminUserAuth: async ({ page }: { page: Page }, use: (session: AuthSession) => Promise<void>) => {
    await use(authSession(page, adminCredentials()));
  },
  guestUser: async (
    { context, page }: { context: BrowserContext; page: Page },
    use: (session: GuestSession) => Promise<void>,
  ) => {
    await clearBrowserSession(context, page);
    await use({
      reset: () => clearBrowserSession(context, page),
    });
  },
};
