import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { LoginPage, type LoginCredentials } from '../pages/LoginPage';

export type UserCredentials = LoginCredentials & {
  username: string;
  displayName: string;
  userId?: string;
};

export type AuthFixtures = {
  normalUserAuth: UserCredentials;
  adminUserAuth: UserCredentials;
  guestUser: Page;
};

function credentialsFromEnv(prefix: 'E2E_USER' | 'E2E_ADMIN'): UserCredentials {
  return {
    email: process.env[`${prefix}_EMAIL`] ?? '',
    password: process.env[`${prefix}_PASSWORD`] ?? '',
    username: process.env[`${prefix}_USERNAME`] ?? '',
    displayName: process.env[`${prefix}_DISPLAY_NAME`] ?? prefix,
    userId: process.env[`${prefix}_ID`],
  };
}

function skipIfMissing(testInfo: TestInfo, creds: UserCredentials, label: string) {
  testInfo.skip(!creds.email || !creds.password, `Set ${label}_EMAIL and ${label}_PASSWORD for this E2E scenario.`);
}

export const test = base.extend<AuthFixtures>({
  normalUserAuth: async ({}, use, testInfo) => {
    const creds = credentialsFromEnv('E2E_USER');
    skipIfMissing(testInfo, creds, 'E2E_USER');
    await use(creds);
  },

  adminUserAuth: async ({}, use, testInfo) => {
    const creds = credentialsFromEnv('E2E_ADMIN');
    skipIfMissing(testInfo, creds, 'E2E_ADMIN');
    await use(creds);
  },

  guestUser: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };

export async function loginAs(page: Page, credentials: LoginCredentials): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.gotoLogin();
  await loginPage.loginSuccessfully(credentials);
}
