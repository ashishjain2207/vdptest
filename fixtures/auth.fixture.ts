import { test as base, type Page } from '@playwright/test';

export type UserCredentials = {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  profileKey?: string;
};

export type AuthFixtures = {
  normalUserAuth: UserCredentials;
  adminUserAuth: UserCredentials;
  guestUser: Page;
};

function credentials(prefix: string): UserCredentials {
  return {
    email: process.env[`${prefix}_EMAIL`] ?? '',
    password: process.env[`${prefix}_PASSWORD`] ?? '',
    username: process.env[`${prefix}_USERNAME`],
    displayName: process.env[`${prefix}_DISPLAY_NAME`],
    profileKey: process.env[`${prefix}_PROFILE_KEY`] ?? process.env[`${prefix}_USERNAME`],
  };
}

export function hasCredentials(user: UserCredentials): boolean {
  return Boolean(user.email && user.password);
}

export function missingCredentialsMessage(prefix: string): string {
  return `Set ${prefix}_EMAIL and ${prefix}_PASSWORD to run this scenario.`;
}

export const authTest = base.extend<AuthFixtures>({
  normalUserAuth: async ({}, use) => {
    await use(credentials('E2E_NORMAL_USER'));
  },
  adminUserAuth: async ({}, use) => {
    await use(credentials('E2E_ADMIN_USER'));
  },
  guestUser: async ({ page, context }, use) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await use(page);
  },
});
